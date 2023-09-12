import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeConnect, User } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import { StripeConnectResponseDto } from './dto/response/stripe-connect.response.dto';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import AppConfig from '../../../configs/app.config';
import { UsersService } from '../users/users.service';
import { GenerateUUID } from '../../../helpers/util.helper';
import * as moment from 'moment-timezone';

@Injectable()
export class StripeConnectService {
  constructor(
    private _dbService: DatabaseService,
    private userService: UsersService,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {}

  async getStripeConnection(userId: string): Promise<StripeConnect> {
    const res = await this._dbService.stripeConnect.findFirst({
      where: { userId: userId },
    });

    return res;
  }

  async connectUserToStripe(userId: string): Promise<StripeConnectResponseDto> {
    const user: User = await this.userService.getUserById(userId);
    const stripeConnectInfo: StripeConnect =
      await this._dbService.stripeConnect.findFirst({
        where: { userId: userId },
      });

    let account = null;
    if (stripeConnectInfo?.stripeAccountId) {
      account = stripeConnectInfo.stripeAccountId;
    } else {
      const res: Stripe.Account = await this.stripeClient.accounts.create({
        type: 'standard',
        email: user.email,
      });

      account = res.id;
    }
    const accountLink: Stripe.AccountLink =
      await this.stripeClient.accountLinks.create({
        account: account,
        refresh_url: `${AppConfig.APP.FRONT_END_APP_URL}/profile?tab=1&success=true&userId=${user.id}`,
        return_url: `${AppConfig.APP.FRONT_END_APP_URL}/profile?tab=1&success=true&userId=${user.id}`,
        type: 'account_onboarding',
      });
    if (!stripeConnectInfo) {
      await this._dbService.stripeConnect.create({
        data: {
          id: GenerateUUID(),
          userId: user.id,
          stripeAccountId: account,
          connectStatus: false,
          created_at: moment().toDate(),
          stripeConnectUrl: accountLink.url,
        },
      });
    }

    return {
      message: 'Stripe link generated',
      url: accountLink.url,
    } as StripeConnectResponseDto;
  }

  async verifyStripeStatus(userId: string): Promise<any> {
    const stripeConnectInfo: StripeConnect =
      await this._dbService.stripeConnect.findFirst({
        where: { userId: userId },
      });
    if (stripeConnectInfo) {
      const account = await this.stripeClient.accounts.retrieve(
        stripeConnectInfo.stripeAccountId,
      );
      if (account && account.details_submitted) {
        await this._dbService.stripeConnect.update({
          where: { userId: userId },
          data: {
            connectStatus: true,
          },
        });
        stripeConnectInfo.connectStatus = true;
      } else {
        stripeConnectInfo.connectStatus = false;
      }
      return stripeConnectInfo;
    } else {
      throw new BadRequestException('Stripe connect information not found');
    }
  }

  async disconnectStripeAccount(userId: string): Promise<String> {
    try {
      const stripeConnectInfo: StripeConnect =
      await this._dbService.stripeConnect.findFirst({
        where: { userId: userId },
      });

    if (stripeConnectInfo) {

      const deleted_at = new Date();

    await this._dbService.stripeConnect.update({
      where: {
        userId: userId
      },
      data: {
        deleted_at: deleted_at
      }
    })

    return "Stripe account disconnected successfully!";
    }

    return "No connected stripe account found";
    }
    catch (error) {
      console.log(error)
      throw new BadRequestException(error?.message);
    }
  }
}