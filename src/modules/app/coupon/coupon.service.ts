import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Roles } from '../../../constants';
import { RolesService } from '../roles/roles.service';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private stripeService: StripeService,
    private stripeConnectService: StripeConnectService,
  ) {}

  async create(accountId: string, data: CreateCouponDto) {
    return await this.stripeService.createCoupon(data, accountId);
  }

  async findAll(accountId: string) {
    return await this.stripeService.findAllCoupons(accountId);
  }

  async findOne(userId: string, id: string) {
    return this.stripeService.findCouponById(userId, id);
  }

  async update(userId: string, updateCouponDto: UpdateCouponDto) {
    const stripeConnect = await this.getStripeConnectInfo(userId);
    return await this.stripeService.updateCoupon(
      updateCouponDto,
      stripeConnect.stripeAccountId,
    );
  }

  async remove(accountId: string, id: string) {
    return await this.stripeService.removeCoupon(id, accountId);
  }

  private async getStripeConnectInfo(userId: string) {
    const userInfo = await this.usersService.getUserById(userId);
    if (!userInfo) {
      throw new NotFoundException('Unable to find user');
    }
    const role = await this.rolesService.getRoleById(userInfo.role_id);
    if (role.name !== Roles.APP_OWNER) {
      throw new BadRequestException(
        'Invalid role, only App Owners can access it',
      );
    }
    const stripeConnect = await this.stripeConnectService.getStripeConnection(
      userId,
    );
    if (!stripeConnect) {
      throw new NotFoundException('Unable to find connected stripe account');
    }
    return stripeConnect;
  }
}
