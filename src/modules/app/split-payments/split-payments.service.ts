import { Injectable, BadRequestException } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { CreateSplitPaymentsDto } from './dto/create-split-payments.dto';

@Injectable()
export class SplitPaymentsService {
  constructor(private _dbService: DatabaseService) {}

  async getSplits(merchant_id: string) {
    try {
      return await this._dbService.split_payments.findMany({
        where: {
          merchant_id: merchant_id,
        },
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong!');
    }
  }

  async getAllApps() {
    try {
      let apps = await this._dbService.app.findMany();
      apps = apps.filter((app) => app.appName || app.bussinessName);
      const user_list = apps.map((app) => app.userId);
      const users = await this._dbService.user.findMany({
        where: {
          id: {
            in: user_list,
          },
          deleted_at: null,
        },
        include: {
          subscriptions: true,
          StripeConnect: true,
          split_payments: {
            where: {
              deleted_at: null,
            },
            include: {
              commissions: {
                include: {
                  User: true,
                },
              },
            },
          },
        },
      });

      return apps.map((app) => {
        const user = users.find((user) => user.id === app.userId);
        return {
          ...app,
          user,
        };
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong.');
    }
  }

  async findAllAccounts() {
    try {
      const commissions = await this._dbService.commissions.findMany({
        include: {
          User: {
            include: {
              StripeConnect: true,
            },
          },
          split_payments: true,
        },
      });

      const users = commissions.filter((user) => user.User);
      return users;
    } catch (error) {
      throw new Error('Error loading all salespersons');
    }
  }

  async addSplit(data: CreateSplitPaymentsDto) {
    try {
      const splitTotal = await this._dbService.split_payments.aggregate({
        where: {
          merchant_id: data.merchant_id,
          deleted_at: null,
        },
        _sum: {
          split: true,
        },
      });

      if (splitTotal._sum.split + data.split > 100) {
        throw new BadRequestException('Not mathematically possible.');
        return;
      }
      return await this._dbService.split_payments.create({
        data: data,
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong!');
    }
  }

  async addCustomerAndSplit(data: any) {
    try {
      const splitTotal = await this._dbService.split_payments.aggregate({
        where: {
          merchant_id: data.customer,
          deleted_at: null,
        },
        _sum: {
          split: true,
        },
      });

      if (splitTotal._sum.split + 33 > 100) {
        throw new BadRequestException('Not mathematically possible.');
      }

      await this._dbService.subscriptions.create({
        data: {
          stripe_subscription_id: data.subscription_id,
          split_status: 'PENDING',
          merchant_id: data.customer,
          referred_by: data.commission_id,
        },
      });

      return await this._dbService.split_payments.create({
        data: {
          stripe_account_id: data.stripe_id,
          email: data.email,
          split: 33,
          merchant_id: data.customer,
          commission_id: data.commission_id,
        },
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong: ' + error.message);
    }
  }

  async updateSplit(id: string, data: any) {
    try {
      return await this._dbService.split_payments.update({
        where: {
          id: id,
        },
        data: {
          split: data.split,
        },
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong!');
    }
  }

  async updateAppSplit(id: string, data: any) {
    try {
      return await this._dbService.split_payments.upsert({
        where: {
          id: id,
        },
        update: {
          split: data.split,
        },
        create: {
          merchant_id: data.merchant_id,
          stripe_account_id: data.stripe_account_id,
          commission_id: data.commission_id,
          split: data.split,
          email: data.email,
        },
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong!');
    }
  }

  async deleteSplit(id: string) {
    try {
      return await this._dbService.split_payments.update({
        where: {
          id: id,
        },
        data: {
          deleted_at: new Date(),
        },
      });
    } catch (error: any) {
      console.log(error.message);
      throw new BadRequestException('Something went wrong!');
    }
  }
}
