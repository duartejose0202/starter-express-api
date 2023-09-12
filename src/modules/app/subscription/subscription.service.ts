import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { Role, split_enum } from '@prisma/client';
import { InjectStripe } from 'nestjs-stripe';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import DatabaseService from 'src/database/database.service';
import { AddDays } from 'src/helpers/date.helper';
import { UsersService } from '../users/users.service';
import { genKey, HashPassword } from 'src/helpers/util.helper';
import { RolesService } from '../roles/roles.service';
import { Roles } from '../../../constants';
import { MobileUsersService } from '../../mobile/users/mobile-users.service';
import { SubscriptionCreatedEvent } from '../../../events/subscription-created.event';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PlatformSubscriptionCreatedEvent } from 'src/events/platform-subscription-created.event';
import { addDays, addMonths, addWeeks, addYears, isBefore, } from 'date-fns';
import { InjectStripeClient, StripeWebhookHandler, } from '@golevelup/nestjs-stripe';
import axios from "axios";
import AppConfig from "../../../configs/app.config";

type FirstCommission = {
  amount?: number;
  percentage?: number;
  time: number;
  time_type: string;
};

type SecondCommission = {
  amount?: number;
  percentage?: number;
  time: number;
  time_type: string;
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectStripe() private readonly stripeClient: Stripe,
    @InjectStripeClient() private stripeWebhookClient: Stripe,
    private _dbService: DatabaseService,
    private userService: UsersService,
    private roleService: RolesService,
    private mobileUserService: MobileUsersService,
    private readonly eventEmitter: EventEmitter2,
    private schedulerRegistry: SchedulerRegistry,
  ) {
  }

  async subscribe(data: any) {
    let customer;
    try {
      customer = await this.stripeClient.customers.create(
        {
          name: data.first_name + ' ' + data.last_name,
          email: data.email,
          payment_method: data.payment_method,
        },
        {
          stripeAccount: data.stripe_account_id,
        },
      );
    } catch (e) {
      switch (e.type) {
        case 'StripeCardError':
          throw new BadRequestException(e.message);
        case 'StripeInvalidRequestError':
          throw new BadRequestException(e.message);
        default:
          throw new BadRequestException(e.message ?? 'Something went wrong.');
      }
    }

    const options = {
      customer: customer.id,
      default_payment_method: data.payment_method,
      items: [{ price: data.stripe_price_id }],
      expand: ['latest_invoice.payment_intent'],
      application_fee_percent: data.mgp_commission ?? 15,
      payment_settings: {
        payment_method_types: ['card'],
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      },
    };

    if (data.currency === 'gbp' || data.currency === 'eur') {
      options['payment_behavior'] = 'allow_incomplete';
    }

    if (data.promotion_code) {
      const promo_codes = await this.stripeClient.promotionCodes.list(
        { limit: 999, code: data.promotion_code },
        {
          stripeAccount: data.stripe_account_id,
        },
      );
      if (promo_codes.data) {
        options['promotion_code'] = promo_codes.data[0]['id'];
      }
    }

    if (data.trial_day) {
      const future = AddDays(new Date(), data.trial_day);
      options['trial_end'] = Math.floor(future.valueOf() / 1000);
    }

    try {
      // @ts-ignore
      const subscription = await this.stripeClient.subscriptions.create(options, {
        stripeAccount: data.stripe_account_id,
      });

      const role: Role = await this.roleService.getRoleByName(Roles.APP_USER);

      if (subscription?.id) {
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const pi = invoice.payment_intent as Stripe.PaymentIntent;

        // handle 3D secure payment
        if (pi && pi.status === 'requires_action') {
          const secret = pi.client_secret;

          // Save user temporarily in database to check against later
          const sca = await this._dbService.sca_purchase.create({
            data: {
              payment_intent: pi.id,
            },
          });

          if (sca?.id) {
            return {
              new_secret: secret,
              customer_id: subscription.customer,
            };
          }
        }
      }

      if (
        subscription.status === 'active' ||
        subscription.status === 'trialing'
      ) {
        const splits = await this._dbService.split_payments.findMany({
          where: {
            merchant_id: data.seller_id,
          },
        });
        let split_status = 'NONE';
        if (splits.length) {
          split_status = 'PENDING';
        }
        const sub_created = await this._dbService.subscriptions.create({
          data: {
            stripe_subscription_id: subscription.id,
            product_id: data.product_id,
            //@ts-ignore
            split_status: split_status as split_enum,
          },
        });

        const auth = await this.userService.createAppUser({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          password: await HashPassword(data.password),
          userId: data.seller_id,
          customerId: subscription.customer,
          appId: data.app_id,
          role_id: role.id,
        });

        try {
          await this.mobileUserService.createSubscription({
            email: data.email,
            subscriptionId: subscription.id,
            stripeCustomerId: customer.id,
            firstName: data.first_name,
            lastName: data.last_name,
            appId: data.firebase_app_id,
            productList: [data.product_id],
          });
        } catch (e) {
          console.error(e);
        }

        if (auth?.id) {
          this.eventEmitter.emit(
            'subscription.created',
            new SubscriptionCreatedEvent({
              merchant_id: data.seller_id,
              merchant_stripe_id: data.stripe_account_id,
              platform_sub: sub_created.id,
              txn: subscription.latest_invoice as Stripe.Invoice,
              splits: splits,
              currency: data.currency,
            }),
          );
          return {
            message: `success`,
          };
        }
      }
    } catch (e) {
      switch (e.type) {
        case 'StripeCardError':
          throw new BadRequestException(e.message);
        case 'StripeInvalidRequestError':
          throw new BadRequestException(e.message);
        default:
          throw new BadRequestException('Something went wrong.');
      }
    }
  }

  async getPromo(promo_code: string, account_id: string) {
    const promo_codes = await this.stripeClient.promotionCodes.list(
      { limit: 999, code: promo_code },
      {
        stripeAccount: account_id,
      },
    );
    if (promo_codes?.data[0]) {
      return promo_codes.data[0];
    } else {
      throw new BadRequestException(
        `No promotion exist for code ${promo_code}`,
      );
    }
  }

  async scaFinalize(data: any) {
    const role: Role = await this.roleService.getRoleByName(Roles.APP_USER);
    const pi = await this.stripeClient.paymentIntents.retrieve(
      data.payment_intent,
      { expand: ['invoice.subscription'] },
      {
        stripeAccount: data.stripe_account_id,
      },
    );

    const invoice = pi?.invoice as Stripe.Invoice;
    if (pi && pi.status === 'succeeded') {
      const splits = await this._dbService.split_payments.findMany({
        where: {
          merchant_id: data.seller_id,
        },
      });
      let split_status = 'NONE';
      if (splits.length) {
        split_status = 'PENDING';
      }
      const sub = await this._dbService.subscriptions.create({
        data: {
          // @ts-ignore
          stripe_subscription_id: invoice?.subscription.id,
          product_id: data.product_id,
          //@ts-ignore
          split_status: split_status as split_enum,
        },
      });
      await this.mobileUserService.createSubscription({
        email: data.email,
        //@ts-ignore
        subscriptionId: invoice.subscription.id,
        stripeCustomerId: pi?.customer as string,
        firstName: data.first_name,
        lastName: data.last_name,
        appId: data.firebase_app_id,
        productList: []
      });
      const auth = await this.userService.createAppUser({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: await HashPassword(data.password),
        userId: data.seller_id,
        customerId: data?.customer_id,
        appId: data.app_id,
        role_id: role.id,
      });

      const del = await this._dbService.sca_purchase.findFirst({
        where: {
          payment_intent: data.payment_intent,
        },
      });
      await this._dbService.sca_purchase.delete({
        where: {
          id: del.id,
        },
      });

      if (auth?.id) {
        this.eventEmitter.emit(
          'subscription.created',
          new SubscriptionCreatedEvent({
            merchant_id: data.seller_id,
            merchant_stripe_id: data.stripe_account_id,
            platform_sub: sub.id,
            txn: invoice,
            splits: splits,
            currency: data.currency,
          }),
        );
        return {
          message: `success`,
        };
      }
    }
  }

  async signup(data: any) {
    const role: Role = await this.roleService.getRoleByName(Roles.APP_USER);

    await this.mobileUserService.createSubscription({
      email: data.email,
      //@ts-ignore
      subscriptionId: 'free',
      stripeCustomerId: 'free',
      firstName: data.first_name,
      lastName: data.last_name,
      appId: data.firebase_app_id,
      productList: [],
    });

    return await this.userService.createAppUser({
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: await HashPassword(data.password),
      userId: data.seller_id,
      customerId: `free_${await genKey(data.first_name, 5)}`,
      role_id: role.id,
    });
  }

  async updatePaymentIntent(data: any) {
    const stripe_account: string = data.stripe_account_id;
    const fee_amount =
      Math.ceil(data.amount) * ((data.mgp_commission ?? 15) / 100);
    const secret = await this.stripeClient.paymentIntents.update(
      data.payment_intent_id,
      {
        amount: data.amount,
        receipt_email: data.email,
        application_fee_amount: fee_amount,
      },
      {
        stripeAccount: stripe_account,
      },
    );

    return secret;
  }

  async finalizePurchase(data: any) {
    const stripe_account: string = data.stripe_account_id;
    const role: Role = await this.roleService.getRoleByName(Roles.APP_USER);

    const pi = await this.stripeClient.paymentIntents.retrieve(
      data.payment_intent,
      { expand: ['latest_charge'] },
      {
        stripeAccount: stripe_account,
      },
    );
    const splits = await this._dbService.split_payments.findMany({
      where: {
        merchant_id: data.seller_id,
      },
    });
    let split_status = 'NONE';
    if (splits.length) {
      split_status = 'PENDING';
    }
    const sub = await this._dbService.subscriptions.create({
      data: {
        // @ts-ignore
        stripe_subscription_id: pi.latest_charge.id,
        product_id: data.product_id,
        //@ts-ignore
        split_status: split_status as split_enum,
      },
    });
    await this.mobileUserService.createSubscription({
      email: data.email,
      //@ts-ignore
      subscriptionId: pi?.latest_charge.id as string,
      //@ts-ignore
      stripeCustomerId: pi?.latest_charge.id as string,
      firstName: data.first_name,
      lastName: data.last_name,
      appId: data.firebase_app_id,
      productList: [],
    });
    const auth = await this.userService.createAppUser({
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: await HashPassword(data.password),
      userId: data.seller_id,
      //@ts-ignore
      customerId: pi?.latest_charge.id,
      appId: data.app_id,
      role_id: role.id,
    });

    if (auth?.id) {
      this.eventEmitter.emit(
        'subscription.created',
        new SubscriptionCreatedEvent({
          merchant_id: data.seller_id,
          merchant_stripe_id: data.stripe_account_id,
          platform_sub: sub.id,
          txn: pi.latest_charge as Stripe.Charge,
          splits: splits,
          // @ts-ignore
          currency: pi.latest_charge.currency,
        }),
      );
      return {
        message: `success`,
      };
    }
  }

  private async sendSplitPayments({ subscriptionEvent }) {
    try {
      if (subscriptionEvent.txn.application_fee_amount > 0) {
        const fee = subscriptionEvent.txn.application_fee_amount / 100;
        subscriptionEvent.splits.forEach(async (split) => {
          const transfer = await this.stripeClient.transfers.create({
            amount: Math.floor(fee * (split.split / 100) * 100),
            currency: 'usd', // subscriptionEvent.currency
            destination: split.stripe_account_id,
          });

          if (!transfer.id) {
            throw new Error(
              `Split id: ${split.id}, Account: ${split.stripe_account_id} - ${split.email}`,
            );
            return;
          }

          console.log(
            `Transfer made for: ${split.stripe_account_id} - ${split.email}`,
          );
        });

        const sub = await this._dbService.subscriptions.update({
          where: {
            id: subscriptionEvent.platform_sub,
          },
          data: {
            // @ts-ignore
            split_status: 'SUCCESS',
          },
        });
        if (sub.id) {
          console.log('ALL TRANSFERS COMPLETED FOR: ', sub.id);
        }
      } else {
        await this._dbService.subscriptions.update({
          where: {
            id: subscriptionEvent.platform_sub,
          },
          data: {
            split_status: 'NONE',
          },
        });
        console.log('NO FEE COLLECTED. EXITING!');
      }
    } catch (error: any) {
      const { logs } = await this._dbService.subscriptions.findUnique({
        where: {
          id: subscriptionEvent.platform_sub,
        },
      });
      const new_logs = logs ? logs + '\n' + error.message : error.message;

      if (error.message.includes('Split id')) {
        await this._dbService.subscriptions.update({
          where: {
            id: subscriptionEvent.platform_sub,
          },
          data: {
            split_status: 'FAILED',
            logs: new_logs,
          },
        });
        return;
      }

      await this._dbService.subscriptions.update({
        where: {
          id: subscriptionEvent.platform_sub,
        },
        data: {
          split_status: 'FAILED',
          logs: new_logs,
        },
      });

      throw new Error(
        `Something went wrong! Exiting. Explanation: ${error.message}`,
      );
    }
  }

  async subscribeDb(data) {
    const split_status = 'NONE';
    const referral = await this._dbService.commissions.findFirst({
      where: {
        identifier: data.referral,
      },
      include: {
        User: {
          include: {
            StripeConnect: true,
          },
        },
      },
    });

    await this._dbService.split_payments.create({
      data: {
        stripe_account_id: referral.User?.StripeConnect.stripeAccountId,
        email: referral.User?.email,
        split: 33,
        merchant_id: data.merchant_id,
        commission_id: referral.id,
      },
    });

    const subscription = await this._dbService.subscriptions.create({
      data: {
        stripe_subscription_id: data.subscription_id,
        split_status: split_status as split_enum,
        merchant_id: data.merchant_id,
        referred_by: referral.id,
      },
    });

    const sub = await this.stripeClient.subscriptions.retrieve(
      data.subscription_id,
      { expand: ['latest_invoice.charge.balance_transaction'] },
    );
    const invoice = sub.latest_invoice as Stripe.Invoice;

    if (subscription?.id) {
      const options = {
        commission_id: referral.id,
        salesperson_stripe_id: referral.User?.StripeConnect?.stripeAccountId,
        platform_sub: subscription.id,
        txn: sub,
        first_commission: referral.first_commission,
        second_commission: referral.second_commission,
        currency: invoice.currency,
        subscription_created: subscription.created_at,
        trial: false,
      };

      if (sub.trial_end) {
        options.trial = true;
      }
      this.eventEmitter.emit(
        'platform.subscription.created',
        new PlatformSubscriptionCreatedEvent(options),
      );

      return subscription;
    }
  }

  @OnEvent('platform.subscription.created')
  async handleSchedulePayments({
                                 subscriptionEvent,
                               }: PlatformSubscriptionCreatedEvent) {
    const invoice = subscriptionEvent.txn.latest_invoice as Stripe.Invoice;
    const charge = invoice.charge as Stripe.Charge;
    const balance_transaction = charge
      ? (charge.balance_transaction as Stripe.BalanceTransaction)
      : null;
    const anchor_date = new Date(
      subscriptionEvent.trial
        ? subscriptionEvent.txn.trial_end * 1000
        : subscriptionEvent.subscription_created,
    );
    const first_commission =
      subscriptionEvent.first_commission as unknown as FirstCommission;
    const second_commission =
      subscriptionEvent.second_commission as unknown as SecondCommission;

    if (!subscriptionEvent.trial && invoice.amount_paid < 100) return;

    let end_first_commission_period;
    let end_second_commission_period;

    switch (first_commission.time_type || second_commission.time_type) {
      case 'day':
        end_first_commission_period = addDays(
          anchor_date,
          first_commission.time,
        );
        end_second_commission_period = addDays(
          end_first_commission_period,
          second_commission.time,
        );
        break;
      case 'week':
        end_first_commission_period = addWeeks(
          anchor_date,
          first_commission.time,
        );
        end_second_commission_period = addWeeks(
          end_first_commission_period,
          second_commission.time,
        );
        break;
      case 'month':
        end_first_commission_period = addMonths(
          anchor_date,
          first_commission.time,
        );
        end_second_commission_period = addMonths(
          end_first_commission_period,
          second_commission.time,
        );
        break;
      case 'year':
        end_first_commission_period = addYears(
          anchor_date,
          first_commission.time,
        );
        end_second_commission_period = addYears(
          end_first_commission_period,
          second_commission.time,
        );
        break;
    }

    // Add dates to database
    await this._dbService.subscriptions.update({
      where: {
        id: subscriptionEvent.platform_sub,
      },
      data: {
        end_first_comm_date: end_first_commission_period,
        end_second_comm_date: end_second_commission_period,
      },
    });

    if (subscriptionEvent.trial) {
      await this._dbService.commission_payments.create({
        data: {
          commission_id: subscriptionEvent.commission_id,
          subscription_id: subscriptionEvent.platform_sub,
          amount: 0,
          payment_status: 'PENDING',
        },
      });
    }

    if (subscriptionEvent.trial) return;

    const amount = first_commission.percentage
      ? Math.round(balance_transaction?.net * (first_commission.percentage / 100))
      : Math.round(first_commission.amount * 100);
    const transfer = await this.stripeClient.transfers.create({
      amount: amount,
      currency: 'usd',
      destination: subscriptionEvent.salesperson_stripe_id,
    });

    if (transfer.id) {
      await this._dbService.commission_payments.create({
        data: {
          commission_id: subscriptionEvent.commission_id,
          subscription_id: subscriptionEvent.platform_sub,
          amount: amount / 100,
        },
      });
      console.log(
        `Transfer of $${amount / 100} made to: ${subscriptionEvent.salesperson_stripe_id}`,
      );
    } else {
      await this._dbService.commission_payments.create({
        data: {
          commission_id: subscriptionEvent.commission_id,
          subscription_id: subscriptionEvent.platform_sub,
          amount: amount / 100,
          payment_status: 'FAILED',
        },
      });
      console.error(
        `Transfer of $${amount / 100} FAILED to: ${subscriptionEvent.salesperson_stripe_id}`,
      );
    }
  }

  @OnEvent('subscription.created')
  handleScheduleTask(event: SubscriptionCreatedEvent) {
    const task_name = `send-payment-for-subscription-${event.subscriptionEvent.platform_sub}`;
    const task_time = setTimeout(
      () => this.sendSplitPayments(event),
      parseInt(process.env.SPLIT_PAYMENTS_TIME),
    );
    this.schedulerRegistry.addTimeout(task_name, task_time);
  }

  @StripeWebhookHandler('customer.subscription.updated')
  async handleSubscriptionUpdated(event: Stripe.Event) {
    console.log(event.data.object);
    const subscriptions = [];
    for await (const sub of this.stripeClient.subscriptions.list({
      status: 'all',
    })) {
      subscriptions.push({
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
      });
    }

    const subdata = await this._dbService.stripesubdata.findMany();

    if (subdata.length) {
      const filtered = subscriptions.filter(
        (item) =>
          !subdata.some(
            (s) =>
              s.stripe_subscription_id === item.stripe_subscription_id &&
              s.subscription_status === item.subscription_status,
          ),
      );

      const objUpdate = [];
      const objCreate = [];

      for (const obj of filtered) {
        const existing = subdata.find(
          (record) =>
            record.stripe_subscription_id === obj.stripe_subscription_id,
        );

        existing ? objUpdate.push(obj) : objCreate.push(obj);
      }

      /* Best to update to an updateMany/wherein at a later time */
      objUpdate.map(async (obj) => {
        await this._dbService.stripesubdata.update({
          where: {
            stripe_subscription_id: obj.stripe_subscription_id,
          },
          data: obj,
        });
      });

      await this._dbService.stripesubdata.createMany({
        data: objCreate,
      });
    } else {
      await this._dbService.stripesubdata.createMany({
        data: subscriptions,
      });
    }
  }

  @StripeWebhookHandler('customer.subscription.deleted')
  async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const customer = await this.stripeClient.customers.retrieve(
      subscription.customer as string,
    );
    if (customer != null && 'name' in customer && 'email' in customer) {
      const response = await axios.post(AppConfig.ZAPIER.WEBHOOK_URL, {
        firstName: customer.name.split(' ')[0],
        lastName: '',
        email: customer.email,
        status: 'canceled',
      });
      console.log(response.status);
      console.log(response.data);
    }

    const subscriptions = [];
    for await (const sub of this.stripeClient.subscriptions.list({
      status: 'all',
    })) {
      subscriptions.push({
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
      });
    }

    const subdata = await this._dbService.stripesubdata.findMany();

    if (subdata.length) {
      const filtered = subscriptions.filter(
        (item) =>
          !subdata.some(
            (s) =>
              s.stripe_subscription_id === item.stripe_subscription_id &&
              s.subscription_status === item.subscription_status,
          ),
      );

      const objUpdate = [];
      const objCreate = [];

      for (const obj of filtered) {
        const existing = subdata.find(
          (record) =>
            record.stripe_subscription_id === obj.stripe_subscription_id,
        );

        existing ? objUpdate.push(obj) : objCreate.push(obj);
      }

      /* Best to update to an updateMany/wherein at a later time */
      objUpdate.map(async (obj) => {
        await this._dbService.stripesubdata.update({
          where: {
            stripe_subscription_id: obj.stripe_subscription_id,
          },
          data: obj,
        });
      });

      await this._dbService.stripesubdata.createMany({
        data: objCreate,
      });
    } else {
      await this._dbService.stripesubdata.createMany({
        data: subscriptions,
      });
    }
  }

  @StripeWebhookHandler('invoice.updated')
  async handlePayout(e: Stripe.Event) {
    const stripe_subscription = await this.stripeClient.subscriptions.retrieve(
      //@ts-ignore
      e.data.object.subscription as string,
      { expand: ['latest_invoice.charge.balance_transaction', 'test_clock'] },
    );
    const invoice = stripe_subscription.latest_invoice as Stripe.Invoice;
    if (invoice.paid !== true) return;
    if (invoice.subscription) {
      const subscription = await this._dbService.subscriptions.findFirst({
        where: {
          stripe_subscription_id: invoice.subscription as string,
        },
        include: {
          commissions: {
            include: {
              User: {
                include: {
                  StripeConnect: true,
                },
              },
            },
          },
        },
      });

      if (!subscription?.id) return;

      const first_commission =
        subscription.commissions.first_commission as unknown as FirstCommission;
      const second_commission =
        subscription.commissions.second_commission as unknown as SecondCommission;
      const charge = invoice.charge as Stripe.Charge;
      const balance_transaction =
        charge.balance_transaction as Stripe.BalanceTransaction;

      let transfer;
      let amount = 0;
      const clock = stripe_subscription.test_clock as Stripe.TestHelpers.TestClock;
      const now = process.env.FROZEN_TIME
        ? new Date(clock.frozen_time * 1000)
        : new Date();

      if (isBefore(now, subscription.end_first_comm_date)) {
        amount = first_commission.percentage
          ? Math.round(balance_transaction.net * (first_commission.percentage / 100))
          : Math.round(first_commission.amount * 100);
        transfer = await this.stripeClient.transfers.create({
          amount: amount,
          currency: 'usd',
          destination: subscription.commissions.User.StripeConnect.stripeAccountId,
        });
      } else {
        if (!isBefore(now, subscription.end_second_comm_date)) return;
        amount = second_commission.percentage
          ? Math.round(balance_transaction.net * (second_commission.percentage / 100))
          : Math.round(second_commission.amount * 100);
        transfer = await this.stripeClient.transfers.create({
          amount: amount,
          currency: 'usd',
          destination: subscription.commissions.User.StripeConnect.stripeAccountId,
        });
      }

      if (transfer.id) {
        await this._dbService.commission_payments.create({
          data: {
            commission_id: subscription.commissions.id,
            subscription_id: subscription.id,
            amount: amount / 100,
          },
        });
        console.log(
          `Transfer of $${amount / 100} made to: ${subscription.commissions.User.StripeConnect.stripeAccountId}`,
        );
      } else {
        await this._dbService.commission_payments.create({
          data: {
            commission_id: subscription.commissions.id,
            subscription_id: subscription.id,
            amount: amount / 100,
            payment_status: 'FAILED',
          },
        });
        console.error(
          `Transfer of $${amount / 100} FAILED to: ${subscription.commissions.User.StripeConnect.stripeAccountId}`,
        );
      }
    }
  }

  async testSubscriptionBilling(subscription_id) {
    const sub = (await this.stripeClient.subscriptions.retrieve(
      subscription_id,
      { expand: ['test_clock'] },
    )) as unknown as Stripe.Subscription;
    const test_clock = sub.test_clock as Stripe.TestHelpers.TestClock;

    if (test_clock.status === 'ready') {
      const future_date = addMonths(new Date(test_clock.frozen_time * 1000), 1);
      const advanced = await this.stripeClient.testHelpers.testClocks.advance(
        test_clock.id,
        {
          frozen_time: Math.round(future_date.getTime() / 1000),
        },
      );

      if (advanced.id) {
        return { message: 'success' };
      } else {
        throw new Error('Something went wrong');
      }
    }
  }
}
