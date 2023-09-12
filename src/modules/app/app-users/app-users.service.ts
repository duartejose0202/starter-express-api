import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import { Roles } from 'src/constants';
import DatabaseService from 'src/database/database.service';
import Stripe from 'stripe';
import { RolesService } from '../roles/roles.service';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { UsersService } from '../users/users.service';
import { CreateAppUserDto } from './dto/create-app-user.dto';
import { UpdateAppUserDto } from './dto/update-app-user.dto';
import { PrismaClient, App, User, Prisma } from '@prisma/client';
import { Timezone } from 'src/helpers/util.helper';
import * as moment from 'moment-timezone';

@Injectable()
export class AppUsersService {
  constructor(
    private _dbService: DatabaseService,
    private usersService: UsersService,
    private rolesService: RolesService,
    private stripeConnectService: StripeConnectService,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {
  }

  create(createAppUserDto: CreateAppUserDto) {
    return 'This action adds a new appUser';
  }

  findAll() {
    return `This action returns all appUsers`;
  }

  async getTotalCustomers() {
    try {
      const accounts: any = await this._dbService.stripeConnect.findMany({});
      const userIds: any = accounts?.map((account: any) => {
        return account?.userId;
      });
      const adminCustomers = await this._dbService.user.findMany({
        where: {
          OR: [
            { id: { in: userIds } },
            { subscription_id: 'free' },
            { subscription_id: { startsWith: 'sub_' } },
          ],
        },
      });
      return {
        users: adminCustomers,
        total: adminCustomers?.length,
        stripeAccounts: accounts,
      };
    } catch (error: any) {
      console.log(error);
    }
  }

  async getSalesTotalCustomers(sales_id: string) {
    try {
      return await this._dbService.subscriptions.count({
        where: {
          referred_by: sales_id,
        },
      });
    } catch (error: any) {
      console.log(error);
    }
  }

  async getSalesUsers(skip: any, limit: any, sortBy: any, sales_id: string) {
    try {
      let users = [];
      if (sortBy === 'id') {
        users = await this._dbService.subscriptions.findMany({
          where: {
            referred_by: sales_id,
          },
          include: {
            User: {
              include: {
                StripeConnect: true,
              },
            },
          },
          skip: skip,
          take: limit,
          orderBy: {
            User: {
              id: 'desc',
            },
          },
        });
      } else if (sortBy == 'created_at') {
        users = await this._dbService.subscriptions.findMany({
          where: {
            referred_by: sales_id,
          },
          include: {
            User: {
              include: {
                StripeConnect: true,
              },
            },
          },
          skip: skip,
          take: limit,
          orderBy: {
            User: {
              created_at: 'desc',
            },
          },
        });
      } else {
        users = await this._dbService.subscriptions.findMany({
          where: {
            referred_by: sales_id,
          },
          include: {
            User: {
              include: {
                StripeConnect: true,
              },
            },
          },
        });
      }

      return { allUsers: users };
    } catch (error: any) {
      console.log(error);
    }
  }

  async getAllUsers(skip: any, limit: any, sortBy: any, filter = 'all') {
    try {
      let users: any = [];

      const query = `
          SELECT "User".*,
                 "StripeConnect"."stripeAccountId" AS "stripeAccountId",
                 "commissions".id                  AS "commission_profile"
          FROM "User"
                   LEFT JOIN "StripeConnect" ON "User".id = "StripeConnect"."userId"
                   LEFT JOIN "commissions" ON "User".id = "commissions"."salesperson_id"
          WHERE "User".deleted_at IS NULL
          GROUP BY "User".id, "StripeConnect".id, "commissions".id;
      `;

      users = await this._dbService.$queryRawUnsafe(query);

      if (filter === 'abandoned') {
        users = users.filter(
          (user) =>
            !user.subscription_status &&
            !!user.signup_status &&
            user.signup_status !== 'completed',
        );
      } else if (filter === 'salesmen') {
        users = users.filter((user) => user.commission_profile);
      } else if (filter === 'trial') {
        users = users.filter((user) =>
          user.subscription_status
            ? user.subscription_status === 'trialing'
            : user.subscription_data?.subscription_status === 'trialing',
        );
      } else if (filter === 'active') {
        users = users.filter((user) =>
          user.subscription_status
            ? user.subscription_status === 'active'
            : user.subscription_data?.subscription_status === 'active',
        );
      } else if (filter === 'failed') {
        users = users.filter((user) =>
          user.subscription_status
            ? user.subscription_status === 'past_due'
            : (user.subscription_data?.subscription_status === 'unpaid' || user.subscription_data?.subscription_status === 'past_due'),
        );
      } else if (filter === 'canceled') {
        users = users.filter((user) =>
          user.subscription_status
            ? user.subscription_status === 'canceled'
            : user.subscription_data?.subscription_status === 'canceled',
        );
      } else if (['test_account', 'demo_app', 'template'].includes(filter)) {
        users = users.filter((user) =>
          user.subscription_status === filter,
        );
      } else {
        users = users.filter((user) => !['test_account', 'demo_app', 'template'].includes(user.subscription_status));
      }


      const user_ids = users.map((user) => user.id);

      /* Stripe subscription status */
      const subs = await this._dbService.stripesubdata.findMany();

      users = users.map((user) => {
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

      users = users.map((user) => {
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

      users = users.map((user) => {
        const sum = fee_data.find((f) => f.userId === user.id);
        return {
          ...user,
          fee: parseInt(sum?.fee) / 100 ?? 0,
        };
      });

      const liveAppCounts = await this._dbService.app.aggregate({
        where: {
          iosStatus: 3,
          androidStatus: 3,
        },
        _count: true,
      });

      /* Sorting */
      let sorted = [];
      if (sortBy === 'created_at') {
        sorted = users.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } else {
        sorted = users.sort((a, b) => a.id.localeCompare(b.id));
      }

      /* Pagination */
      const startIndex = skip;
      const endIndex = startIndex + limit;
      const paginated = sorted.slice(startIndex, endIndex);

      return {
        allUsers: paginated,
        totalCustomers: users.length,
        liveAppsCount: liveAppCounts?._count ?? 0,
      };
    } catch (error: any) {
      console.error(error);
      throw new Error('Something went wrong!');
    }
  }

  async getAdminCustomer(adminId: any) {
    try {
      const accounts: any = await this._dbService.stripeConnect.findMany({});
      const userIds: any = accounts?.map((account: any) => {
        return account?.userId;
      });

      let user: any = [];
      user = await this._dbService.user.findMany({
        where: {
          id: adminId,
        },
      })

      const users: any = user?.map((user: any) => {
        return user?.id
      })

      const fees: any = await this._dbService.superAdminFees.findMany({ where: { userId: { in: users } } })

      const apps = await this._dbService.app.findMany();

      const allUsers = [];

      for (let i = 0; i < user.length; i++) {
        let totalFee: number = 0;
        for (let j = 0; j < fees?.length; j++) {
          if (fees[j]?.userId == user[i]?.id) {
            totalFee += fees[j]?.amount;
          }
        }

        allUsers.push({
          ...user[i],
          fee: totalFee,
          stripeAccountId:
            accounts?.filter((_user: any) => _user?.userId == user[i]?.id)[0]
              ?.stripeAccountId || null,
          appInfo:
            apps.filter((appUser: any) => appUser?.userId == user[i].id)
              ?.length > 0
              ? apps.filter((appUser: any) => appUser?.userId == user[i].id)
              : {},
        });
      }

      const liveAppCounts = await this._dbService.app.aggregate({
        where: {
          iosStatus: 3,
          androidStatus: 3,
        },
        _count: true,
      });

      return { allUsers: allUsers, liveAppsCount: liveAppCounts?._count ?? 0 };
    } catch (error: any) {
      console.log(error);
    }
  }

  async getTotalCustomersForAdmins(accountId: string, userId: string) {
    try {
      if (!accountId || accountId == undefined || accountId == 'undefined') {
        return { accounts: [], total: 0 };
      }
      const today = moment().tz(Timezone);
      let startDate = today.clone().startOf('day');
      let endDate = today.clone();

      const all = [];
      let startIndex: any = null;
      let accounts: any = [];

      let options: any = {
        limit: 100,
        expand: ['data.subscriptions'],
        created: {
          gte: startDate.unix(),
          lte: endDate.unix(),
        }
      };

      do {
        if (startIndex) {
          options = {
            limit: 100,
            starting_after: startIndex,
            expand: ['data.subscriptions'],
            created: {
              gte: startDate.unix(),
              lte: endDate.unix(),
            }
          };
        }

        accounts = await this.stripeClient.customers.list(options, {
          stripeAccount: accountId,
        });
        for (let i = 0; i < accounts.data?.length; i++) {
          all.push(accounts.data[i]);
        }
        startIndex = accounts.data[accounts.data.length - 1]?.id ?? 0;
      } while (accounts?.has_more == true);

      const customers = await this._dbService.adminCustomers.findMany({
        select: {
          email: true,
          name: true,
          userId: true,
          id: true,
          customerId: true,
          updated_at: true,
          balance: true,
          created_at_unix: true,
        },
        where: {
          userId: userId
        },
        orderBy: {
          created_at_unix: 'desc'
        }
      })

      for (let i = all?.length - 1; i >= 0; i--) {
        if (customers?.filter((s) => s?.customerId == all[i]?.id)?.length == 0) {
          customers.unshift({
            email: all[i]?.email,
            name: all[i]?.name,
            userId: userId,
            id: all[i]?.id,
            created_at_unix: all[i]?.created,
            customerId: all[i]?.id,
            updated_at: new Date(all[i]?.created * 1000),
            balance: 0
          })
        }
      }

      const allCustomers = customers?.map((customer: any) => {
        return {
          created_at_unix: customer?.created_at_unix?.toString(),
          email: customer?.email,
          name: customer?.name,
          userId: userId,
          id: customer?.customerId,
          rowId: customer?.id,
          updated_at: new Date(customer?.created * 1000),
          balance: customer?.balance
        }
      })

      return { accounts: allCustomers, total: allCustomers?.length };
    } catch (error: any) {
      console.log(error);
    }
  }

  async getCustomersByAdminId(accountId: string, skip: any, limit: any, sortBy: any, userId: any) {
    try {
      if (!accountId || accountId == undefined || accountId == 'undefined') {
        return { accounts: [], total: 0 };
      }
      const today = moment().tz(Timezone);
      let startDate = today.clone().startOf('day');
      let endDate = today.clone();

      const all = [];
      let startIndex: any = null;
      let accounts: any = [];

      let options: any = {
        limit: 100,
        expand: ['data.subscriptions'],
        created: {
          gte: startDate.unix(),
          lte: endDate.unix(),
        }
      };

      do {
        if (startIndex) {
          options = {
            limit: 100,
            starting_after: startIndex,
            expand: ['data.subscriptions'],
            created: {
              gte: startDate.unix(),
              lte: endDate.unix(),
            }
          };
        }

        accounts = await this.stripeClient.customers.list(options, {
          stripeAccount: accountId,
        });
        for (let i = 0; i < accounts.data?.length; i++) {
          all.push(accounts.data[i]);
        }
        startIndex = accounts.data[accounts.data.length - 1]?.id ?? 0;
      } while (accounts?.has_more == true);

      const selectedItems = all?.slice(skip, limit);
      const newLimit = selectedItems?.length > 0 ? (limit - selectedItems.length) + 1 : limit - selectedItems.length;

      const customers = await this._dbService.adminCustomers.findMany({
        skip: (skip - selectedItems?.length) >= 0 ? skip - selectedItems?.length : 0,
        take: newLimit,
        select: {
          email: true,
          name: true,
          userId: true,
          id: true,
          customerId: true,
          updated_at: true,
          balance: true,
          created_at_unix: true,
        },
        where: {
          userId: userId
        },
        orderBy: {
          created_at_unix: 'desc'
        }
      })

      const customerIds = customers.map((c) => {
        return c?.customerId
      })

      let subscriptions = []

      try {
        subscriptions = await this._dbService.adminSubscriptions.findMany({
          where: { customerId: { in: customerIds }, status: 'active' }, orderBy: {
            created_at_unix: 'desc'
          }
        });
      } catch (error) {

      }

      for (let i = selectedItems?.length - 1; i >= 0; i--) {
        if (customers?.filter((s) => s?.customerId == selectedItems[i]?.id)?.length == 0) {
          customers.unshift({
            email: selectedItems[i]?.email,
            name: selectedItems[i]?.name,
            userId: userId,
            id: selectedItems[i]?.id,
            created_at_unix: selectedItems[i]?.created,
            customerId: selectedItems[i]?.id,
            updated_at: new Date(selectedItems[i]?.created * 1000),
            balance: 0
          })
        }
      }

      const allCustomers = customers?.map((customer: any) => {
        return {
          created_at_unix: customer?.created_at_unix?.toString(),
          email: customer?.email,
          name: customer?.name,
          userId: userId,
          id: customer?.customerId,
          rowId: customer?.id,
          updated_at: new Date(customer?.created * 1000),
          balance: customer?.balance,
          productName: subscriptions?.filter((s) => s.customerId == customer?.customerId)?.length > 0 ? subscriptions?.filter((s) => s.customerId == customer?.customerId)[0]?.productName : null
        }
      })

      return { accounts: allCustomers, total: allCustomers?.length };
    } catch (error: any) {
      console.log(error);
    }
  }

  async getAllCustomerInfoForUser(id: string) {
    const batchSize = 10;
    let skip = 0;
    let allCustomers = [];

    while (true) {
      const users = await this._dbService.appUser.findMany({
        skip,
        take: batchSize,
        where: {
          userId: id,
        },
      });

      if (!users.length) break;

      const customerIds = users.map((user) => user.customerId);
      const stripeConnect = await this.getStripeConnectInfo(id);
      const customers = await Promise.all(
        customerIds.map(async (customerId) => {
          return {
            customer: await this.stripeClient.customers.retrieve(
              customerId,
              {
                expand: ['subscriptions.data.plan.product'],
              },
              { stripeAccount: stripeConnect.stripeAccountId },
            ),
            charges: await this.stripeClient.charges.list(
              {
                customer: customerId,
              },
              { stripeAccount: stripeConnect.stripeAccountId },
            ),
          };
        }),
      );

      const combinedCustomers = customers.map(({ customer, charges }: any) => {
        const appuser = users.find((user) => user.customerId === customer.id);
        const updatedCustomer = {
          customerId: customer.id,
          created: customer.created,
          defaultSource: customer.default_source,
          subscription: {
            id: customer?.subscriptions?.data[0]?.id,
            current_period_start:
            customer?.subscriptions?.data[0]?.current_period_start,
            current_period_end:
            customer?.subscriptions?.data[0]?.current_period_end,
          },
          discount: customer?.subscriptions?.data[0]?.discount
            ? {
              id: customer?.subscriptions?.data[0]?.discount.id,
              couponId: customer?.subscriptions?.data[0]?.discount.coupon.id,
            }
            : null,
          plan: {
            id: customer?.subscriptions?.data[0]?.plan.id,
            object: customer?.subscriptions?.data[0]?.plan.object,
            active: customer?.subscriptions?.data[0]?.plan.active,
            aggregate_usage:
            customer?.subscriptions?.data[0]?.plan.aggregate_usage,
            amount: customer?.subscriptions?.data[0]?.plan.amount,
            amount_decimal:
            customer?.subscriptions?.data[0]?.plan.amount_decimal,
            billing_scheme:
            customer?.subscriptions?.data[0]?.plan.billing_scheme,
            created: customer?.subscriptions?.data[0]?.plan.created,
            currency: customer?.subscriptions?.data[0]?.plan.currency,
            interval: customer?.subscriptions?.data[0]?.plan.interval,
            interval_count:
            customer?.subscriptions?.data[0]?.plan.interval_count,
            livemode: customer?.subscriptions?.data[0]?.plan.livemode,
            metadata: customer?.subscriptions?.data[0]?.plan.metadata,
            nickname: customer?.subscriptions?.data[0]?.plan.nickname,
            tiers_mode: customer?.subscriptions?.data[0]?.plan.tiers_mode,
            transform_usage:
            customer?.subscriptions?.data[0]?.plan.transform_usage,
            trial_period_days:
            customer?.subscriptions?.data[0]?.plan.trial_period_days,
            usage_type: customer?.subscriptions?.data[0]?.plan.usage_type,
          },
          product: { ...customer?.subscriptions?.data[0]?.plan.product },
          charges: {
            id: charges?.data[0]?.id,
            chargedAmount: charges?.data[0]?.amount,
            balance_transaction_id: charges?.data[0]?.balance_transaction,
            invoiceId: charges?.data[0]?.invoice,
          },
        };

        return {
          ...appuser,
          ...updatedCustomer,
        };
      });

      allCustomers = allCustomers.concat(combinedCustomers);

      skip += batchSize;
    }
  }

  async deleteCustomer(id: string) {
    try {
      const user = await this._dbService.user.findUnique({
        where: {
          id: id,
        },
      });
      if (user.subscription_id) {
        try {
          await this.stripeClient.subscriptions.cancel(user.subscription_id);
        } catch (error: any) {
          if (error.type === 'StripeInvalidRequestError') {
            console.error('Stripe SDK error: ', error.message);
          } else {
            throw error;
          }
        }
      }

      const apps = await this._dbService.app.findMany({
        where: {
          userId: id,
        },
      });
      const appList = apps.map((app) => app.id);

      await this._dbService.app.updateMany({
        where: {
          id: { in: appList },
        },
        data: {
          deleted_at: new Date(),
        },
      });
      const deleted = await this._dbService.user.update({
        where: {
          id: id,
        },
        data: {
          deleted_at: new Date(),
        },
      });
      await this._dbService.admin_changes.create({
        data: {
          table: 'user',
          column_changed: 'id',
          record_id: id,
          type: 'DELETE',
        },
      });

      return deleted;
    } catch (error: any) {
      console.error('Error with deleting customer: ', error);
      throw new BadRequestException('Something went wrong: ', error.message);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} appUser`;
  }

  update(id: number, updateAppUserDto: UpdateAppUserDto) {
    return `This action updates a #${id} appUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} appUser`;
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
