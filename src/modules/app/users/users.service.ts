import { Injectable } from '@nestjs/common';
import { AppUser, PasswordToken, User } from '@prisma/client';
import * as moment from 'moment-timezone';
import DatabaseService from '../../../database/database.service';
import { encryptData, GenerateUUID, genKey, HashPassword } from '../../../helpers/util.helper';
import { SignUpDto } from './dto/signup.dto';
import { addWeeks } from 'date-fns';

@Injectable()
export class UsersService {
  constructor(private _dbService: DatabaseService) {}

  async getUserByEmail(email: string): Promise<User> {
    const user = await this._dbService.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    return user;
  }

  async getAppUserByEmail(email: string): Promise<AppUser> {
    const user = await this._dbService.appUser.findFirst({
      where: { email: email?.toLowerCase() },
    });
    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this._dbService.user.findFirst({
      where: { id },
    });
    return user;
  }

  async updateUserPassword(
    token: PasswordToken,
    newPassword: string,
  ): Promise<string> {
    await this._dbService.user.update({
      where: { id: token.userId },
      data: {
        password: await HashPassword(newPassword),
        updated_at: moment().toDate(),
      },
    });
    await this._dbService.passwordToken.update({
      where: { id: token.id },
      data: {
        isConsumed: true,
        updated_at: moment().toDate(),
      },
    });
    return 'Password reset successfully';
  }

  async editCustomer(data: any, id: string): Promise<string> {
    if (data?.prevStripeAccountId) {
      if (data?.prevStripeAccountId?.trim() != data?.stripeAccountId?.trim()) {
        await this._dbService.stripeConnect.update({
          where: { userId: id },
          data: {
            stripeAccountId: data?.stripeAccountId,
          },
        });
      }
    }

    await this._dbService.user.update({
      where: { id: id },
      data: {
        updated_at: moment().toDate(),
        phone_number: data?.phone_number,
        first_name: data?.first_name,
        last_name: data?.last_name,
        email: data?.email,
        mgp_commission: data?.mgp_commission,
        subscription_status: data?.subscription_status,
        subscription_id: data?.subscription_id,
      },
    });

    const appData = {
      appName: data?.appName,
      iosStatus: data?.iosStatus,
      androidStatus: data?.androidStatus,
      firebase_app_id: data?.firebase_app_id,
    }

    if (data?.push_notification_key != null && data?.push_notification_key != '') {
      appData['push_notification_key'] = encryptData(data?.push_notification_key);
    }

    if (!data?.appId) {
      await this._dbService.app.create({
        data: {
          userId: id,
          ...appData
        },
      });

      return 'User updated successfully';
    }
    await this._dbService.app.update({
      where: { id: data?.appId },
      data: appData,
    });

    await this._dbService.admin_changes.create({
      data: {
        table: 'user',
        column_changed: 'id',
        record_id: id,
        logs: JSON.stringify(data),
        type: 'MODIFY',
      },
    });

    return 'User updated successfully';
  }

  async createUser(data: SignUpDto): Promise<User> {
    return this._dbService.user.create({
      data: {
        email: data.email,
        name: data.name,
        first_name: data?.first_name,
        last_name: data?.last_name,
        password: data.password ? await HashPassword(data.password) : null,
        role_id: data.roleId,
        phone_number: data?.phone_number,
        firebase_uid: data.firebaseUid ? data.firebaseUid : null,
        mgp_commission: data?.mgp_commission || 15,
      },
    });
  }

  async createSalesUser(data: any): Promise<User> {
    const user = await this._dbService.user.create({
      data: {
        email: data.email,
        name: data.first_name + ' ' + data.last_name,
        first_name: data?.first_name,
        last_name: data?.last_name,
        password: data.password ? await HashPassword(data.password) : null,
        role_id: data.roleId,
        mgp_commission: 15,
        created_at: moment().toDate(),
      },
    });

    if (user?.id) {
      await this._dbService.commissions.create({
        data: {
          identifier: await genKey([user.id, user.name].toString()),
          salesperson_id: user.id,
          first_commission: {
            percentage: 15,
            amount: null,
            time: 3,
            time_type: 'month',
          },
          second_commission: {
            percentage: 0,
            amount: null,
            time: 100,
            time_type: 'year',
          },
        },
      });

      return await this._dbService.user.findFirst({
        where: {
          id: user.id,
        },
        include: {
          commissions: true,
        },
      });
    }
  }

  async createAppUser(data: any): Promise<any> {
    return this._dbService.appUser.create({
      data: {
        id: GenerateUUID(),
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password ? await HashPassword(data.password) : null,
        firebase_uid: data.firebase_id,
        role_id: data.role_id,
        appID: data.appId,
        customerId: data.customerId,
        userId: data.userId,
      },
    });
  }

  async createOwner(data: SignUpDto): Promise<User> {
    return this._dbService.user.create({
      data: {
        email: data.email,
        password: data.password ? await HashPassword(data.password) : null,
        name: data.name,
        role_id: data.roleId,
        first_name: data.first_name,
        last_name: data.last_name,
        google_id: data.google_id,
        facebook_id: data.facebook_id,
        phone_number: data.phone_number,
        logo: data.logo,
        is_show_logo: data.is_show_logo,
        signup_status: data.signup_status,
        created_at: moment().toDate(),
        free_trial_end_date: addWeeks(new Date(), 2),
      },
    });
  }

  async updateOwner(data: any): Promise<User> {
    const updateData = data.password
      ? { ...data, password: await HashPassword(data.password) }
      : data;
    return this._dbService.user.update({
      where: { id: data.id },
      data: {
        ...updateData,
        updated_at: moment().toDate(),
      },
    });
  }
  async searchCustomer(skip: any, limit: any, searchKey: any): Promise<any> {
    try {
      let allUsers: any = [];
      let users: any = [];

      const query = `
        SELECT "User".*, 
          "StripeConnect"."stripeAccountId" AS "stripeAccountId",
          (SELECT ROW_TO_JSON("StripeConnect")
            FROM "StripeConnect" 
            WHERE "User".id = "StripeConnect"."userId") AS "stripeAccount",
          (SELECT ROW_TO_JSON("App")
            FROM "App" 
            WHERE "User".id = "App"."userId"
            LIMIT 1) AS "appInfo",
          (SELECT ROW_TO_JSON("commissions")
            FROM "commissions" 
            WHERE "User".id = commissions.salesperson_id) AS "commission_profile"
        FROM "User"
        LEFT JOIN "StripeConnect" ON "User".id = "StripeConnect"."userId"
        WHERE "User".deleted_at IS NULL
        GROUP BY "User".id, "StripeConnect".id;
      `;

      allUsers = await this._dbService.$queryRawUnsafe(query);
      const user_ids = allUsers.map((user) => user.id);

      /* Stripe subscription status */
      const subs = await this._dbService.stripesubdata.findMany();

      allUsers = allUsers.map((user) => {
        const subscription_data = subs.find(
          (s) => s.stripe_subscription_id === user.subscription_id,
        );
        return {
          ...user,
          subscription_data,
        };
      });

      /* Determine if referred by salesman */
      const sales = await this._dbService.subscriptions.findMany({
        where: {
          referred_by: {
            not: null,
          },
        },
      });

      allUsers = allUsers.map((user) => {
        const referral_data = sales.find((s) => s.merchant_id === user.id);
        return {
          ...user,
          referral_data,
        };
      });

      /* Get fees */
      const fees = await this._dbService.adminCharges.findMany({
        where: {
          status: 'succeeded',
          userId: { in: user_ids },
        },
        select: {
          userId: true,
          fee: true,
        },
      });

      type FeeData = {
        userId: string;
        fee: number | any;
      };

      const fee_data: FeeData[] = Object.entries(
        fees.reduce((result, { userId, fee }) => {
          result[userId] = (result[userId] || 0) + fee;
          return result;
        }, {}),
      ).map(([userId, fee]) => ({ userId, fee }));

      allUsers = allUsers.map((user) => {
        const sum = fee_data.find((f) => f.userId === user.id);
        return {
          ...user,
          fee: parseInt(sum?.fee) / 100 ?? 0,
        };
      });

      users = allUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchKey.toLowerCase()) ||
          user.first_name?.toLowerCase().includes(searchKey.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchKey.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchKey.toLowerCase()),
      );

      const liveAppCounts = await this._dbService.app.aggregate({
        where: {
          iosStatus: 3,
          androidStatus: 3,
        },
        _count: true,
      });

      /* Pagination */
      const startIndex = skip;
      const endIndex = startIndex + limit;
      const paginated = users.slice(startIndex, endIndex);

      console.log(users.length);
      return {
        allUsers: paginated,
        totalCustomers: users.length,
        searchKey: searchKey,
        liveAppsCount: liveAppCounts?._count ?? 0,
      };
    } catch (error: any) {
      console.error(error);
      throw new Error('Something went wrong!');
    }
  }
}
