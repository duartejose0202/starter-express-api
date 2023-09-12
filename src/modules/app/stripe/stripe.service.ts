import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { converToUnix } from '../../../helpers/date.helper';
import * as moment from 'moment-timezone';
import { PrismaClient } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import DatabaseService from 'src/database/database.service';
import { getPriceIdByPlan, getOfferPriceIdByPlan } from 'src/helpers/util.helper';
import { Now, DiffBetweenTwoDates } from 'src/helpers/date.helper';
import { Timezone } from 'src/helpers/util.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { AddSubscriptionDTO } from '../pricing-plan/dto/add-subscription-dto';

const prisma = new PrismaClient();

type Customer = {
  name: string;
  email: string;
  payment_method: string;
  invoice_settings: any;
  test_clock?: string;
};

const PAYMENT_TOTAL_FIX_DAYS = 14;

@Injectable()
export class StripeService {
  constructor(
    @InjectStripe() private readonly stripeClient: Stripe,
    private readonly usersService: UsersService,
    private _dbService: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async createPaymentIntent(data: any, stripeAccountId: string): Promise<any> {
    return await this.stripeClient.paymentIntents.create(data, {
      stripeAccount: stripeAccountId,
    });
  }

  async updatePaymentIntent(data: any, stripeAccountId: string): Promise<any> {
    return await this.stripeClient.paymentIntents.update(
      data.payment_id,
      { amount: data.amount },
      {
        stripeAccount: stripeAccountId,
      },
    );
  }

  async createCoupon(data: any, stripeAccountId: string): Promise<any> {
    const couponExists = await this.stripeClient.promotionCodes.list(
      { code: data.code },
      {
        stripeAccount: stripeAccountId,
      },
    );

    if (couponExists.data.length) {
      throw new Error('Coupon already exists.');
    }

    // After promo code check
    const metaData = {
      product: JSON.stringify(data.product),
    };
    const expiry = converToUnix(data?.selectedDate);
    const couponObj: any = {
      name: data.name,
      duration: 'forever',
      metadata: metaData,
      applies_to: {
        products: data.product.map((item) => item.value),
      },
      redeem_by: expiry,
    };

    if (data.percentage) couponObj.percent_off = data.percentage;
    if (data.fixedPrice) couponObj.amount_off = data.fixedPrice;
    if (data.fixedPrice && data.currency) couponObj.currency = data.currency;

    const coupon = await this.stripeClient.coupons.create(couponObj, {
      stripeAccount: stripeAccountId,
    });

    if (coupon.id) {
      const promo = await this.stripeClient.promotionCodes.create(
        { coupon: coupon.id, code: data.code },
        {
          stripeAccount: stripeAccountId,
        },
      );

      return promo;
    }

    throw new Error('Something went wrong.');
  }

  async findAllCoupons(stripeAccountId: string) {
    const coupons = await this.stripeClient.promotionCodes.list(
      { active: true, limit: 100 },
      {
        stripeAccount: stripeAccountId,
      },
    );

    return coupons.data;
  }

  async findCouponById(couponId: string, stripeAccountId: string) {
    return await this.stripeClient.promotionCodes.retrieve(couponId, {
      stripeAccount: stripeAccountId,
    });
  }

  async findCouponByCode(couponCode: string, stripeAccountId: string) {
    const promos = await this.stripeClient.promotionCodes.list({
      stripeAccount: stripeAccountId,
    });
    return promos.data.find((x) => x.code === couponCode);
  }

  async isToday(endDate: any) {
    const today = moment().tz(Timezone).startOf('day');
    const end = moment(endDate).tz(Timezone).startOf('day');

    return end.isSame(today, 'day');
  }

  async updateCoupon(updateStripeDto: any, stripeAccountId: string) {
    return await this.stripeClient.coupons.update(
      updateStripeDto.couponID,
      {
        name: updateStripeDto.name,
      },
      {
        stripeAccount: stripeAccountId,
      },
    );
  }

  async removeCoupon(couponId: string, stripeAccountId: string) {
    const deleted = await this.stripeClient.promotionCodes.update(
      couponId,
      { active: false },
      {
        stripeAccount: stripeAccountId,
      },
    );

    return deleted;
  }

  async findAllProducts(accountId: string) {
    const products = await this.stripeClient.products.list(
      { active: true, expand: ['data.default_price'], limit: 100 },
      {
        stripeAccount: accountId,
      },
    );

    return products.data;
  }

  async createProduct(data: any, accountId: string): Promise<any> {
    const recurringObject = data?.duration
      ? await this.getRecursiveBillingDataFrontendToBackend(data?.duration)
      : undefined;

    const productObj: any = {
      name: data.name,
      default_price_data: {
        currency: data.currency,
        unit_amount: Math.round(data.price * 100),
        recurring: recurringObject,
      },
    };
    if (data.desc) {
      productObj.description = data.desc;
    }
    const product = await this.stripeClient.products.create(productObj, {
      stripeAccount: accountId,
    });

    const priceObj = await this.stripeClient.prices.retrieve(
      product.default_price.toString(),
      {
        stripeAccount: accountId,
      },
    );
    const responseData: any = {
      id: product.id,
      pricingId: priceObj.id,
      name: product.name,
      billing: priceObj.recurring ? 'Recurring' : 'One Time',
      price: priceObj.unit_amount / 100,
      desc: product.description,
    };
    if (priceObj.recurring) {
      const duration = this.getRecursiveBillingDataStripeToFrontend(
        priceObj.recurring,
      );
      responseData.duration = duration;
    }
    return responseData;
  }

  async findProductById(productId: string, accountId: string) {
    const product = await this.stripeClient.products.retrieve(productId, {
      stripeAccount: accountId,
    });

    const priceObj = await this.stripeClient.prices.retrieve(productId, {
      stripeAccount: accountId,
    });

    return {
      id: product.id,
      pricingId: priceObj.id,
      name: product.name,
      billing: priceObj.recurring ? 'Recurring' : 'One Time',
      price: priceObj.unit_amount / 100,
      desc: product.description,
    };
  }

  async findPriceById(productId: string, accountId: string) {
    return await this.stripeClient.prices.retrieve(productId, {
      stripeAccount: accountId,
    });
  }

  async updateProduct(data: any, accountId: string) {
    const product = this.stripeClient.products.update(
      data.id,
      {
        name: data.name,
        description: data.description,
      },
      {
        stripeAccount: accountId,
      },
    );

    return product;
  }

  async removeProduct(productId: string, accountId: string) {
    const prices = await this.stripeClient.prices.list({
      stripeAccount: accountId,
    });
    const productPrices = prices.data.filter(
      (x: Stripe.Price) => x.product === productId,
    );
    const result = await this.stripeClient.products.update(
      productId,
      {
        default_price: null,
        active: false,
      },
      {
        stripeAccount: accountId,
      },
    );
    for (let index = 0; index < productPrices.length; index++) {
      await this.stripeClient.prices.update(
        productPrices[index].id,
        { active: false },
        {
          stripeAccount: accountId,
        },
      );
    }
    return result;
  }

  async createAppUser(data: any, accountId: string) {
    try {
      if (!data.cardNumber) {
        const customer = await this.stripeClient.customers.create(
          {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
          },
          {
            stripeAccount: accountId,
          },
        );
        return { ...data, customerId: customer.id };
      } else {
        const card: Stripe.TokenCreateParams.Card = {
          number: data.cardNumber.replace(/ /g, ''),
          exp_month: parseInt(data.cardExpiry.split('/')[0]).toString(),
          exp_year: '20' + data.cardExpiry.split('/')[1].trim(),
          cvc: data.cardCvc,
          name: `Card deatil of ${data.firstName} ${data.lastName}`,
        };

        const token = await this.stripeClient.tokens.create(
          {
            card,
          },
          {
            stripeAccount: accountId,
          },
        );

        const customer = await this.stripeClient.customers.create(
          {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            source: token.id,
          },
          {
            stripeAccount: accountId,
          },
        );

        if (!data?.cardId) {
          const price = await this.stripeClient.prices.retrieve(data.priceId, {
            stripeAccount: accountId,
          });
          const promotionCodes = data.discountCode
            ? (
              await this.stripeClient.promotionCodes.list(
                { code: data.discountCode },
                { stripeAccount: accountId },
              )
            ).data ?? null
            : null;
          if (promotionCodes) {
            const promotionCode = promotionCodes[0];
            if (!promotionCode) {
              await this.stripeClient.customers.del(customer.id, {
                stripeAccount: accountId,
              });
              throw new HttpException(
                `This code is invalid`,
                HttpStatus.BAD_REQUEST,
              );
            }

            const { coupon } = promotionCode;
            const productMetadata = JSON.parse(coupon.metadata.product);
            const isApplicable = productMetadata.some(
              (item) => item.value === price.product,
            );

            if (!isApplicable) {
              await this.stripeClient.customers.del(customer.id, {
                stripeAccount: accountId,
              });
              throw new HttpException(
                `This code is not applicable for this product`,
                HttpStatus.BAD_REQUEST,
              );
            }
          }

          if (price.recurring) {
            const discountCode =
              (promotionCodes && promotionCodes[0]?.id) ?? null;
            const dataObj: any = {
              customer: customer.id,
              items: [{ price: data.priceId }],
            };
            if (discountCode) {
              dataObj.promotion_code = discountCode;
            }
            const subscription = await this.stripeClient.subscriptions.create(
              dataObj,
              { stripeAccount: accountId },
            );
          } else {
            const amountOff =
              promotionCodes && (promotionCodes[0]?.coupon.amount_off ?? 0);
            const percentageOff =
              promotionCodes && (promotionCodes[0]?.coupon.percent_off ?? 0);
            const { unit_amount: unitAmount } = price;
            const amountPercentage = unitAmount / 100 - amountOff / 100;
            const amountFixed = unitAmount / 100 - amountOff;

            const finalAmount =
              percentageOff > 0
                ? amountFixed * (1 - percentageOff / 100)
                : amountPercentage;
            await this.stripeClient.charges.create(
              {
                amount: promotionCodes ? finalAmount * 100 : unitAmount,
                currency: 'usd',
                customer: customer.id,
              },
              { stripeAccount: accountId },
            );
            if (promotionCodes) {
              const timesRedeemed =
                promotionCodes[0]?.metadata &&
                promotionCodes[0]?.metadata.times_redeemed;
              const newTimesRedeemed =
                (timesRedeemed ? Number(timesRedeemed) : 0) + 1;
              const updatedPromotionCode =
                await this.stripeClient.promotionCodes.update(
                  promotionCodes[0]?.id,
                  {
                    metadata: {
                      times_redeemed: String(newTimesRedeemed),
                    },
                  },
                  { stripeAccount: accountId },
                );
            }
          }
        }
        return { ...data, customerId: customer.id };
      }
    } catch (error) {
      console.error('error in stripe ', error);
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllSubscriptionsByCustomer(
    stripe_account_id: any,
    customer_id: any,
  ) {
    try {
      const subscriptions = [];
      let startIndex: any = null;
      let subs: any = [];

      let options: any = {
        limit: 100,
      };

      do {
        if (startIndex) {
          options = {
            limit: 100,
            starting_after: startIndex,
          };
        }

        subs = await this.stripeClient.subscriptions.list(
          {
            customer: customer_id,
            expand: ['data.plan.product', 'data.latest_invoice'],
            limit: 100,
          },
          { stripeAccount: stripe_account_id },
        );

        if (subs.data.length > 0) {
          for (let i = 0; i < subs.data.length; i++) {
            subscriptions.push(subs.data[i]);
          }
        }
        startIndex = subs.data[subs.data.length - 1]?.id ?? 0;
      } while (subs?.has_more == true);

      return subscriptions;
    } catch (error: any) {
      return [];
    }
  }

  async getAllSubscriptionsAndChargesByCustomer(
    stripe_account_id: any,
    customer_id: any,
  ) {
    try {
      const subscriptions = [];
      let startIndex: any = null;
      let subs: any = [];

      let options: any = {
        limit: 100,
      };

      do {
        if (startIndex) {
          options = {
            limit: 100,
            starting_after: startIndex,
          };
        }

        subs = await this.stripeClient.subscriptions.list(
          {
            customer: customer_id,
            expand: ['data.plan.product', 'data.latest_invoice'],
            limit: 100,
          },
          { stripeAccount: stripe_account_id },
        );

        if (subs.data.length > 0) {
          for (let i = 0; i < subs.data.length; i++) {
            subscriptions.push(subs.data[i]);
          }
        }
        startIndex = subs.data[subs.data.length - 1]?.id ?? 0;
      } while (subs?.has_more == true);

      const data = [];

      for (let subscription of subscriptions) {
        const res = await this.getAllChargesForSubscriptionForCustomer(
          stripe_account_id,
          customer_id,
          subscription?.id
        );
        data.push({
          subscription: subscription,
          charges: res
        });

      }
      return data;
    } catch (error: any) {
      return [];
    }
  }

  async getAllChargesByCustomer(stripe_account_id: any, customer_id: any) {
    try {
      const charges = [];
      let startIndex: any = null;
      let chargs: any = [];

      let options: any = {
        limit: 100,
      };

      do {
        if (startIndex) {
          options = {
            limit: 100,
            starting_after: startIndex,
          };
        }

        chargs = await this.stripeClient.charges.list(
          {
            customer: customer_id,
            limit: 100,
          },
          { stripeAccount: stripe_account_id },
        );

        if (chargs.data.length > 0) {
          for (let i = 0; i < chargs.data.length; i++) {
            charges.push(chargs.data[i]);
          }
        }
        startIndex = chargs.data[chargs.data.length - 1].id;
      } while (chargs?.has_more == true);

      return charges;
    } catch (error: any) {
      return [];
    }
  }

  async cancelSubscription(
    stripe_account_id: any,
    customer_id: any,
    subscription_id: any,
  ) {
    const res = await this.stripeClient.subscriptions.del(subscription_id, {
      stripeAccount: stripe_account_id,
    });

    if (res?.status == 'canceled') {
      const sub = await this._dbService.adminSubscriptions.findFirst(
        {
          where: {
            subscriptionId: subscription_id
          }
        })

      if (sub?.id) {
        await this._dbService.adminSubscriptions.update(
          {
            where: {
              id: sub.id
            },
            data: {
              status: res?.status,
              canceled_at_unix: res?.canceled_at
            }
          })
      }
    }

    return res;
  }

  async refundPayment(stripeAccountId: any, customer_id: any, chargeId: any) {
    // Retrieve the charge
    const charge = await this.stripeClient.charges.retrieve(chargeId, {
      stripeAccount: stripeAccountId,
    });

    // Check if the charge can be refunded
    if (charge.refunded) {
      return { message: 'Charge has already been refunded', status: false };
    } else if (charge.amount_refunded === charge.amount) {
      return { message: 'Charge has been fully refunded', status: false };
    } else {
      // Refund the charge
      const refund = await this.stripeClient.refunds.create(
        {
          charge: chargeId,
        },
        { stripeAccount: stripeAccountId },
      );

      return {
        message: 'Charge has been refunded successfully!',
        status: true,
      };
    }
  }

  async getAllCharges(accountId: string) {
    const allCharges = [];
    const charges = await this.stripeClient.charges.list(
      {
        limit: 100,
      },
      {
        stripeAccount: accountId,
      },
    );
    allCharges.push(...charges.data);
    let hasMore = charges.has_more;
    let lastItem = charges.data.slice(-1)[0]?.id;
    while (hasMore) {
      const moreCharges = await this.stripeClient.charges.list(
        {
          limit: 100,
          starting_after: lastItem,
        },
        {
          stripeAccount: accountId,
        },
      );
      allCharges.push(...moreCharges.data);
      hasMore = moreCharges.has_more;
      lastItem = moreCharges.data.slice(-1)[0]?.id;
    }

    return allCharges.reverse();
  }

  stripeToJson = async (stripePromoCode) => {
    const selectedDate = new Date(stripePromoCode.expires_at * 1000);

    const result: any = {
      name: stripePromoCode.coupon.name,
      code: stripePromoCode.code,
      selectedDate: selectedDate.toISOString(),
      couponID: stripePromoCode.coupon.id,
      codeID: stripePromoCode.id,
      product: JSON.parse(stripePromoCode.coupon.metadata.product),
    };
    if (stripePromoCode.coupon.percent_off) {
      result.percentage = stripePromoCode.coupon.percent_off;
    } else {
      result.fixedPrice = stripePromoCode.coupon.amount_off / 100;
    }
    return result;
  };

  getRecursiveBillingDataFrontendToBackend(duration: string): any | undefined {
    enum Interval {
      Day = 'day',
      Week = 'week',
      Month = 'month',
      Year = 'year',
    }

    const billingData: { interval: Interval; interval_count?: number } = {
      interval: Interval.Month,
    };

    switch (duration) {
      case 'Weekly':
        billingData.interval = Interval.Week;
        break;
      case 'Monthly':
        break;
      case 'Every 3 Month':
        billingData.interval_count = 3;
        break;
      case 'Every 6 Month':
        billingData.interval_count = 6;
        break;
      case 'Every Year':
        billingData.interval = Interval.Year;
        break;
      default:
        return undefined;
    }

    return billingData;
  }

  getRecursiveBillingDataStripeToFrontend(data: any): string | undefined {
    if (!data) {
      return undefined;
    }

    const { interval, interval_count } = data;
    let duration: string;

    switch (`${interval}_${interval_count}`) {
      case 'week_1':
        duration = 'Weekly';
        break;
      case 'month_1':
        duration = 'Monthly';
        break;
      case 'month_3':
        duration = 'Every 3 Month';
        break;
      case 'month_6':
        duration = 'Every 6 Month';
        break;
      case 'year_1':
        duration = 'Every Year';
        break;
      default:
        duration = '';
    }

    return duration;
  }

  async getAllChargesForSubscriptionForCustomer(
    stripe_account_id: string,
    customer_id: string,
    subscriptionId: string
  ) {
    try {
      const invoices = [];
      let startIndex: any = null;
      let subs: any = [];

      let options: any = {
        limit: 100,
      };

      do {
        if (startIndex) {
          options = {
            limit: 100,
            starting_after: startIndex,
          };
        }

        subs = await this.stripeClient.invoices.list(
          {
            customer: customer_id,
            expand: ["data.charge"],
            subscription: subscriptionId,
            limit: 100,
          },
          { stripeAccount: stripe_account_id },
        );

        if (subs.data.length > 0) {
          for (let i = 0; i < subs.data.length; i++) {
            invoices.push(subs.data[i]?.charge);
          }
        }
        startIndex = subs.data[subs.data.length - 1]?.id ?? 0;
      } while (subs?.has_more == true);

      return invoices;
    } catch (error: any) {
      console.log(error)
      return [];
    }
  }

  async createSubscriptionForCustomer(accountId: string, priceId: string, customerId: string, default_payment_method: string) {
    const subscription = await this.stripeClient.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      default_payment_method: default_payment_method,
      expand: ['latest_invoice.payment_intent'],
    }, {
      stripeAccount: accountId
    });
    return subscription;
  }

  // create product subscript for customer

  async addSubscriptionForCustomer(accountId: string, data: AddSubscriptionDTO) {
    try {

      const paymentMethods: any = await this.stripeClient.paymentMethods.list({
        customer: data?.customerId,
        type: 'card',
        limit: 1,
      }, {
        stripeAccount: accountId
      });

      if (paymentMethods.data.length > 0) {
        const latestPaymentMethod = paymentMethods.data[0];

        await this.createSubscriptionForCustomer(data.accountId, data.priceId, data.customerId, latestPaymentMethod?.id);

        return "Subscription has been created successfully";
      } else {
        throw new Error("No payment methods found for the customer.");
      }

    }
    catch (error) {
      throw new Error(error?.message);
    }
  }

  async editProductForCustomer(data: any, accountId: string) {
    try {
      const product = await this.stripeClient.products.update(
        data?.productId,
        {
          name: data.name,
          description: data.desc,
        },
        {
          stripeAccount: accountId,
        },
      );

      return "Product has been edited successfully!";
    }
    catch (error) {
      return error;
    }
  }

  async getSalesNetVolume(
    timeRange: string,
    custom: any,
    account_id: string,
  ): Promise<any> {
    let startDate: any = '';
    let endDate: any = '';
    timeRange = timeRange.toLowerCase();

    if (timeRange == 'custom') {
      const endDatePlusOneDay = moment(custom?.endDate).tz(Timezone);
      startDate = moment(custom?.startDate).tz(Timezone);
      endDate = endDatePlusOneDay;
    }

    if (timeRange != 'custom') {
      startDate = await this.getStartEndDate(timeRange).startDate;
      endDate = await this.getStartEndDate(timeRange).endDate;
    }

    startDate = moment(new Date((new Date(startDate)?.getMonth() + 1) + "/" + (new Date(startDate)?.getDate() + 1) + "/" + new Date(startDate)?.getFullYear())).tz(Timezone).startOf('day');
    endDate = moment(new Date((new Date(endDate)?.getMonth() + 1) + "/" + (new Date(endDate)?.getDate() + 1) + "/" + new Date(endDate)?.getFullYear())).tz(Timezone).endOf('day');

    let granularity = 'day';

    if (timeRange == 'last 12 weeks' || timeRange == 'year to date') {
      granularity = 'month';
    }

    const { chargeDataArray, feeDataArray, successCount } =
      await this.getSalesCommissions(
        startDate,
        endDate,
        granularity,
        account_id,
      );
    const sales = [];

    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateKey = moment
        .unix(currentDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');

      const date = new Date(dateKey);
      // // Set the time part to 00:00:00 to avoid timezone-related issues
      date.setHours(0, 0, 0, 0);

      sales.push({
        date,
        charge: chargeDataArray[dateKey] ?? 0,
      });

      currentDate = currentDate.add(1, 'days');
    }

    const data = sales.map((sale) => ({
      date: moment(sale.date).format(
        granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD',
      ),
      netVolume: sale.charge,
    }));

    const totalNetVolume = sales.reduce((sum, sale) => sum + sale.charge, 0);
    return {
      data: data,
      totalNetVolume: totalNetVolume,
    };
  }

  async getNetVolume(timeRange: string, custom: any): Promise<any> {
    let startDate: any = '';
    let endDate: any = '';
    timeRange = timeRange.toLowerCase();

    if (timeRange == 'custom') {
      const endDatePlusOneDay = moment(custom?.endDate).tz(Timezone);
      startDate = moment(custom?.startDate).tz(Timezone);
      endDate = endDatePlusOneDay;
    }

    if (timeRange != 'custom') {
      startDate = await this.getStartEndDate(timeRange).startDate;
      endDate = await this.getStartEndDate(timeRange).endDate;
    }

    startDate = moment(new Date((new Date(startDate)?.getMonth() + 1) + "/" + (new Date(startDate)?.getDate() + 1) + "/" + new Date(startDate)?.getFullYear())).tz(Timezone).startOf('day');
    endDate = moment(new Date((new Date(endDate)?.getMonth() + 1) + "/" + (new Date(endDate)?.getDate() + 1) + "/" + new Date(endDate)?.getFullYear())).tz(Timezone).endOf('day');

    let granularity = 'day';

    if (timeRange == 'last 12 weeks' || timeRange == 'year to date') {
      granularity = 'month';
    }

    const { chargeDataArray, feeDataArray, successCount } =
      await this.getSuperAdminFeesAndCharges(startDate, endDate, granularity);
    const sales = [];

    // Process and update the data in the database

    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateKey = moment
        .unix(currentDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');

      const date = new Date(dateKey);
      // // Set the time part to 00:00:00 to avoid timezone-related issues
      date.setHours(0, 0, 0, 0);

      sales.push({
        date,
        charge: chargeDataArray[dateKey] ?? 0,
        fee: feeDataArray[dateKey] ?? 0,
      })

      currentDate = currentDate.add(1, 'days');
    }

    const data = sales.map((sale) => ({
      date: moment(sale.date).format(
        granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD',
      ),
      netVolume: sale.charge + sale.fee,
    }));

    const totalNetVolume = sales.reduce(
      (sum, sale) => sum + sale.charge / 100 + sale.fee / 100,
      0,
    );

    const totalCollectedFee = sales.reduce((sum, f) => sum + f.fee, 0);

    return {
      data: data,
      totalNetVolume: totalNetVolume,
      collectedFee: totalCollectedFee / 100,
    };
  }

  async getTodaySalesNetVolume(time, accountId?: string): Promise<any> {
    const today = moment().tz(Timezone);
    const currentDate = moment();
    const startDate = currentDate.startOf('day').toDate();
    const endDate = currentDate.endOf('day').toDate();

    const granularity = 'today';

    const netVolumeArray = [];

    //

    const chargeDataArray = {};

    let chargesLists = null;
    if (accountId) {
      chargesLists = await this._dbService.commission_payments.findMany({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          commission_id: accountId,
        },
      });
    }

    if (chargesLists.length) {
      for (const charge of chargesLists) {
        const dateKey = moment(charge.created_at)
          .tz(Timezone)
          .format('YYYY-MM-DD HH:00');
        if (!chargeDataArray[dateKey]) {
          chargeDataArray[dateKey] = 0;
        }

        const netAmount = charge.amount;
        chargeDataArray[dateKey] += netAmount;
      }
    }

    for (
      let currentTime = moment(startDate);
      currentTime.isBefore(endDate);
      currentTime.add(1, 'hour')
    ) {
      const dateKey = moment
        .unix(currentTime.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD HH:00');

      netVolumeArray.push({
        date: dateKey,
        netVolume: chargeDataArray[dateKey] ?? 0,
      });
    }
    const totalNetVolume = netVolumeArray.reduce(
      (sum, netVolumeArray) => sum + netVolumeArray.netVolume,
      0,
    );

    return {
      data: netVolumeArray,
      totalNetVolume: totalNetVolume,
    };
  }

  async getTodayNetVolume(accountId?: string): Promise<any> {
    const today = moment().tz(Timezone);
    const startDate = today.clone().startOf('day');
    const endDate = today.clone();

    const granularity = 'today';

    const { chargeDataArray, feeDataArray, successCount } =
      await this.getFeeAndCharges(startDate, endDate, granularity, accountId);

    const netVolumeArray = [];

    for (
      let currentTime = startDate;
      currentTime.isBefore(endDate);
      currentTime.add(1, 'hour')
    ) {
      const dateKey = moment
        .unix(currentTime.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD HH:00');

      netVolumeArray.push({
        date: dateKey,
        netVolume:
          (feeDataArray[dateKey] ?? 0) / 100 +
          (chargeDataArray[dateKey] ?? 0) / 100,
      });
    }

    const totalNetVolume = netVolumeArray.reduce(
      (sum, netVolumeArray) => sum + netVolumeArray.netVolume,
      0,
    );

    const totalCollectedFee = Object.values(feeDataArray).reduce(
      (sum: number, f: number) => sum + f,
      0,
    );

    return {
      data: netVolumeArray,
      totalNetVolume: totalNetVolume,
      collectedFee: (totalCollectedFee as number) / 100,
    };
  }

  async getDashboardStatistics(accountId?: string, userId?: string): Promise<any> {
    if (!accountId) {
      return {
        data: {},
        totalNetVolume: 0,
        successCount: 0,
      };
    }
    const existingRecord = await prisma.dashboardGrossVolume.findUnique({
      where: { stripeAccountId: accountId },
    });

    return {
      data: {},
      totalNetVolume: existingRecord.value,
      successCount: 0,
    };
  }

  async setGrossVolume(): Promise<any> {
    const account_stripe_ids: Array<string> = [
      'acct_1JxgNq2QkXXpVeIx',
      'acct_1LAEhHI7ihmf5t2b',
      'acct_1K7e6fPa6ueBtUus',
      'acct_1K7fXDPaCLaXR8qO',
      'acct_1K7ncj2QtMo46dKb',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1K8Bug2QAVYxlqaS',
      'acct_1K8IhP2RMghKo09W',
      'acct_1K8XjZ2Rd4cCyPAF',
      'acct_1L8VAGBLyMvL70AU',
      'acct_1KEJ9i2S1rM6xP7j',
      'acct_1KIIqu2RwgZVuM5Y',
      'acct_1KIKuW2QjyxmYcbQ',
      'acct_1KJ3xl2SG71UQdXX',
      'acct_1JsRB52QDfEubrwZ',
      'acct_1L8U6fFLa5YuU4i3',
      'acct_1KLn6q2SK7EwvGNA',
      'acct_1KH6dH2SN5atfvtd',
      'acct_1KX9MI2RXXZ0zS4r',
      'acct_1KXAYr2SrrzS5b75',
      'acct_1KYyTv2RSfdbLGO1',
      'acct_1Kermz2QtnVbpmDW',
      'acct_1KfBma2QMKaNH9cw',
      'acct_1KghXH2Q2eKbZing',
      'acct_1KghXI2Qn6kPlf9T',
      'acct_1KghXJ2RtFgXTC1i',
      'acct_1KghXK2RHNxHT7oF',
      'acct_1L5b71DFOFjKyUTY',
      'acct_1L5b71DFOFjKyUTY',
      'acct_1KvQTA2Rk0KKqZnc',
      'acct_1KvRKg2RZt3Blcm6',
      'acct_1KOoqqC4IKhZKE04',
      'acct_1KfBma2QMKaNH9cw',
      'acct_1IpVxEKL91e8pL62',
      'acct_1L8Y7IKIblcz1LHW',
      'acct_1KOWA4H4kR4qFR2k',
      'acct_1KYyTv2RSfdbLGO1',
      'acct_1L5xjGFLddxeDXas',
      'acct_1LAehJJnJKBlXwei',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1L63862RsIzaA1X4',
      'account_1234',
      'acct_1LA4T52Snzjfxyxl',
      'acct_1LA4XB2RG0rd9KSh',
      'acct_1LAbO7DwuDGyKach',
      'acct_1LAht52QF1yIv5oS',
      'acct_1LBSfqFxeUxpyYtI',
      'acct_1LBRkKGJhIjRsDkM',
      'acct_1K7nul2QNmFPFj4P',
      'acct_1LBRkKGJhIjRsDkMn',
      'acct_1L5xjGFLddxeDXas',
      'acct_1LMI8V2Qd6VX3Oe5',
      'acct_1LO4iJ2QnCKBK4gE',
      'acct_1LTDcF2ScOhKCauX',
      'acct_1LbUms2SzQB8fGYN',
      'acct_1LekkI2RATYL7DLH',
      'acct_1LwbSVEAUN7oOoP4',
      'acct_1M3R0EECj56iDN8r',
      'acct_1M3mBlEKkdf8KMfF',
      'acct_1M4Ti6ERH8qxvMxG',
      'acct_1M5ZkXCjLVbur78g',
      'acct_1MDeoVBuNTa1xweZ',
      'acct_1MG99vE7GVPE3Roz',
      'acct_1MkaIoE7k5Pp2dp9',
      'acct_1MqgPZCvgic0tfZi',
    ];

    for (const account_id of account_stripe_ids) {
      try {
        const { chargeDataArray, feeDataArray, successCount } =
          await this.getGrossFeeAndCharges(account_id);

        let totalGrossVolume = 0;
        for (const key in chargeDataArray) {
          if (chargeDataArray.hasOwnProperty(key)) {
            totalGrossVolume += chargeDataArray[key] / 100;
          }
        }

        const existingRecord = await prisma.dashboardGrossVolume.findUnique({
          where: { stripeAccountId: account_id },
        });

        if (existingRecord) {
          if (existingRecord.value < totalGrossVolume) {
            await prisma.dashboardGrossVolume.update({
              where: { stripeAccountId: account_id },
              data: {
                value: totalGrossVolume,
              },
            });
          }
        } else {
          await prisma.dashboardGrossVolume.create({
            data: {
              stripeAccountId: account_id,
              value: totalGrossVolume,
            },
          });
        }
      } catch (error) {
        console.log(error);
        continue;
      }
    }

    console.log('finished');
  }

  async getActiveSubscriptionsyAdmin(accountId: string, userId: string) {
    if (!accountId) {
      return { subscriptions: [], total: 0 };
    }

    try {

      const today = moment().tz(Timezone);
      let startDate = today.clone().startOf('day');
      let endDate = today.clone();

      const all = [];
      let startIndex: any = null;
      let subs: any = [];

      let options: any = {
        limit: 100,
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
            created: {
              gte: startDate.unix(),
              lte: endDate.unix(),
            }
          };
        }

        subs = await this.stripeClient.subscriptions.list(options, {
          stripeAccount: accountId,
        });

        for (let i = 0; i < subs.data?.length; i++) {
          if (
            subs.data[i]?.status == 'active' ||
            subs.data[i]?.status == 'past_due' ||
            subs.data[i]?.status == 'incomplete'
          ) {
            all.push(subs.data[i]);
          }
        }
        startIndex = subs.data[subs.data.length - 1]?.id ?? 0;
      } while (subs?.has_more == true);

      const allSubs = await this._dbService.adminSubscriptions.findMany({
        select: {
          amount: true,
          id: true,
          subscriptionId: true
        },
        where: {
          userId: userId,
          OR: [
            {
              status: 'active'
            },
            {
              status: 'past_due'
            },
            {
              status: 'incomplete'
            },
          ]
        }
      })

      const subscriptions = allSubs;

      for (let i = 0; i < all?.length; i++) {
        // if (subscriptions?.filter((s)=>s?.subscriptionId == all[i]?.id )?.length==0) {
        subscriptions.push(all[i])
        // }
      }

      return { subscriptions: subscriptions, total: subscriptions?.length };
    }
    catch (error: any) {
      console.log(error);
    }
  }

  async getCancelledSubscriptionsyAdmin(
    timeRange: string,
    custom: any,
    accountId?: string,
    userId?: string
  ) {

    if (!accountId) {
      return {
        message: 'To view your analytics, connect your Stripe account',
        accountNotFound: true,
        data: [],
        totalNetVolume: 0.0,
      };
    }

    const all = [];
    let startIndex: any = null;
    let subs: any = [];

    let startDate: any = '';
    let endDate: any = '';
    timeRange = timeRange.toLowerCase();

    if (timeRange == 'custom') {
      startDate = moment(custom?.startDate).tz(Timezone);
      endDate = moment(custom?.endDate).tz(Timezone);
    }

    if (timeRange != 'custom') {
      startDate = await this.getStartEndDate(timeRange).startDate;
      endDate = await this.getStartEndDate(timeRange).endDate;
    }

    startDate = moment(new Date((new Date(startDate)?.getMonth() + 1) + "/" + (new Date(startDate)?.getDate() + 1) + "/" + new Date(startDate)?.getFullYear())).tz(Timezone).startOf('day');
    endDate = moment(new Date((new Date(endDate)?.getMonth() + 1) + "/" + (new Date(endDate)?.getDate() + 1) + "/" + new Date(endDate)?.getFullYear())).tz(Timezone).endOf('day');

    let granularity = 'day';

    if (timeRange == 'last 12 weeks' || timeRange == 'year to date') {
      granularity = 'month';
    }

    const today = moment().tz(Timezone);
    const startOfToday = today.clone().startOf('day');
    const endOfToday = today.clone();

    // let options: any = {
    //   limit: 100,
    //   status: 'canceled',
    //   created: {
    //     gte: startOfToday.unix(),
    //     lte: endOfToday.unix(),
    //   },
    // };

    // if (await this.isToday(new Date(endDate.unix() * 1000)) == true) {
    //   do {
    //     if (startIndex) {
    //       options = {
    //         limit: 100,
    //         starting_after: startIndex,
    //         status: 'canceled',
    //         created: {
    //           gte: startOfToday.unix(),
    //           lte: endOfToday.unix(),
    //         },
    //       };
    //     }

    //     subs = await this.stripeClient.subscriptions.list(options, {
    //       stripeAccount: accountId,
    //     });

    //     for (let i = 0; i < subs.data?.length; i++) {
    //       all.push(subs.data[i]);
    //     }
    //     startIndex = subs?.data[subs.data.length - 1]?.id ?? 0;
    //   } while (subs?.has_more == true);
    // }

    const allSubs = await this._dbService.adminSubscriptions.findMany({
      where: {
        userId: userId,
        status: 'canceled',
        canceled_at_unix: {
          gte: startDate.unix(),
          lte: endDate.unix(),
        },
      }
    })

    const data = [];

    for (let i = 0; i < (all.length > 0 ? allSubs?.length - 1 : allSubs?.length); i++) {
      data.push(allSubs[i]);
    }
    for (let i = 0; i < all.length; i++) {
      data.push(all[i]);
    }

    const subArray: any = {};

    // Sum up the charges amounts from all pages
    for (const customer of data) {
      let dateKey = moment
        .unix(customer.created ? customer?.canceled_at_at_unix : Number(customer?.canceled_at_unix))
        .tz(Timezone)
        .format('YYYY-MM-DD');
      if (granularity == 'today') {
        dateKey = moment
          .unix(customer.created ? customer?.created : Number(customer?.canceled_at_unix))
          .tz(Timezone)
          .format('YYYY-MM-DD HH:00');
      }

      if (!subArray[dateKey]) {
        subArray[dateKey] = 0;
      }

      subArray[dateKey]++;
    }

    if (granularity == 'today') {
      const subsArray = [];

      for (
        let currentTime = startDate;
        currentTime.isBefore(endDate);
        currentTime.add(1, 'hour')
      ) {
        const dateKey = moment
          .unix(currentTime.unix())
          .tz(Timezone)
          .format('YYYY-MM-DD HH:00');

        subsArray.push({
          date: dateKey,
          cancellations: (subArray[dateKey] ?? 0) * 100,
        });
      }

      const totalSubs = subsArray.reduce(
        (sum, netVolumeArray) => sum + netVolumeArray?.cancellations,
        0,
      );
      return { data: subsArray, totalNetVolume: totalSubs };
    }

    const allDateCustomerArray = {};
    let currentDate = startDate;
    while (currentDate <= endDate) {
      const dateKey = moment
        .unix(currentDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');

      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);

      allDateCustomerArray[dateKey] = subArray[dateKey] ?? 0;
      currentDate = currentDate.add(1, 'days');
    }

    const customerArray = [];
    let totalSubs = 0;
    for (const key in allDateCustomerArray) {
      if (allDateCustomerArray.hasOwnProperty(key)) {
        totalSubs += allDateCustomerArray[key];
        customerArray.push({
          date: key,
          cancellations: allDateCustomerArray[key] * 100,
        });
      }
    }

    return { data: customerArray, totalNetVolume: totalSubs };
  }

  async getDashboardNetVolume(
    timeRange: string,
    custom: any,
    accountId?: string,
    userId?: string
  ): Promise<any> {
    try {
      const timezone = 'America/Los_Angeles';
      let startDate: any = '';
      let endDate: any = '';
      timeRange = timeRange.toLowerCase();

      if (timeRange == 'custom') {
        startDate = moment(custom?.startDate).tz(timezone);
        endDate = moment(custom?.endDate).tz(timezone);
      }

      if (timeRange != 'custom') {
        startDate = await this.getStartEndDate(timeRange).startDate;
        endDate = await this.getStartEndDate(timeRange).endDate;
      }

      startDate = moment(new Date((new Date(startDate)?.getMonth() + 1) + "/" + (new Date(startDate)?.getDate() + 1) + "/" + new Date(startDate)?.getFullYear())).tz(Timezone).startOf('day');
      endDate = moment(new Date((new Date(endDate)?.getMonth() + 1) + "/" + (new Date(endDate)?.getDate() + 1) + "/" + new Date(endDate)?.getFullYear())).tz(Timezone).endOf('day');

      let granularity = 'day';

      if (timeRange == 'last 12 weeks' || timeRange == 'year to date') {
        granularity = 'month';
      }

      const { chargeDataArray, feeDataArray, successCount } =
        await this.getSuperAdminFeesAndCharges(startDate, endDate, granularity, userId, accountId);

      // Process and update the data in the database
      let currentDate = startDate;

      while (currentDate <= endDate) {
        const dateKey = moment
          .unix(currentDate.unix())
          .tz(timezone)
          .format('YYYY-MM-DD');

        const date = new Date(dateKey);
        // // Set the time part to 00:00:00 to avoid timezone-related issues
        date.setHours(0, 0, 0, 0);

        if (!chargeDataArray[dateKey]) {
          chargeDataArray[dateKey] = 0;
        }

        currentDate = currentDate.add(1, 'days');
      }

      // return { chargeArray: chargeDataArray, feeArray: feeDataArray }

      const allChargeDataArray = [];
      let totalNetVolume = 0;

      for (const key in chargeDataArray) {
        if (chargeDataArray.hasOwnProperty(key)) {
          totalNetVolume += chargeDataArray[key] / 100;
          allChargeDataArray.push({
            date: key,
            netVolume: chargeDataArray[key],
          });
        }
      }

      allChargeDataArray.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      return {
        data: allChargeDataArray,
        totalNetVolume: totalNetVolume,
        successCount: successCount,
      };
    } catch (error: any) {
      return {
        message: !accountId
          ? 'To view your analytics, connect your Stripe account'
          : error?.message,
        accountNotFound: !accountId ? true : false,
        data: [],
        totalNetVolume: 0.0,
        successCount: 0,
      };
    }
  }

  // @Cron('* * 0 * * *', {
  //   name: 'end-of-day',
  //   timeZone: Timezone,
  // })
  async saveChargesData() {
    const all = [];
    let startIndex: any = null;
    let accounts: any = [];

    let options: any = {
      limit: 100,
    };

    do {
      if (startIndex) {
        options = {
          limit: 100,
          starting_after: startIndex,
        };
      }

      accounts = await this.stripeClient.accounts.list(options);
      all.push(accounts.data);
      startIndex = accounts.data[accounts.data.length - 1].id;
    } while (accounts?.has_more == true);

    if (all.length > 0) {
      const emails = all[0]
        ?.map((account) => {
          if (typeof account.email === 'string') {
            return account.email;
          }
          return null;
        })
        .filter((email) => email !== null);

      const users = await this._dbService.user.findMany({
        where: {
          email: { in: emails },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      return { users: users, total: users?.length, stripeAccounts: all };
    }
  }

  async getNetVolumeForSale(timeRange: string): Promise<any> {
    const { startDate, endDate } = await this.getStartEndDate(timeRange);
    const granularity = 'day';

    const { chargeDataArray, feeDataArray, successCount } =
      await this.getFeeAndCharges(startDate, endDate, granularity);

    // Process and update the data in the database
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateKey = moment
        .unix(currentDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');

      const date = new Date(dateKey);
      // // Set the time part to 00:00:00 to avoid timezone-related issues
      date.setHours(0, 0, 0, 0);

      const existingRecord = await prisma.netVolumeSales.findUnique({
        where: { date },
      });

      if (existingRecord) {
        if (existingRecord.fee !== feeDataArray[dateKey]) {
          await prisma.netVolumeSales.update({
            where: { id: existingRecord.id },
            data: {
              charge: chargeDataArray[dateKey] ?? 0,
              fee: feeDataArray[dateKey] ?? 0,
            },
          });
        }
      } else {
        await prisma.netVolumeSales.create({
          data: {
            date,
            charge: chargeDataArray[dateKey] ?? 0,
            fee: feeDataArray[dateKey] ?? 0,
          },
        });
      }

      currentDate = currentDate.add(1, 'days');
    }

    return { charges: chargeDataArray, appFees: feeDataArray };
  }

  async getGrossFeeAndCharges(accountId?: string): Promise<any> {
    const today = moment().tz(Timezone);
    let successfulChargeCount = 0;

    const chargeDataArray = {};
    const feeDataArray = {};
    const { startDate, endDate } = await this.getStartEndDate('last 12 months');

    const stripeConfig1: any = {
      created: {
        gte: startDate.unix(),
        lte: endDate.unix(),
      },
      limit: 100,
    };

    let chargesLists;
    if (accountId) {
      chargesLists = await this.stripeClient.charges.list(stripeConfig1, {
        stripeAccount: accountId,
      });
    } else {
      chargesLists = await this.stripeClient.charges.list(stripeConfig1);
    }

    const YOUR_COMMISSION_RATE = 0;
    // Sum up the charges amounts from all pages
    while (chargesLists.data.length > 0) {
      for (const charge of chargesLists.data) {
        const dateKey = moment
          .unix(charge.created)
          .tz(Timezone)
          .format('YYYY-MM-DD');

        if (!chargeDataArray[dateKey]) {
          chargeDataArray[dateKey] = 0;
        }

        const amount = charge.amount;
        const applicationFeeAmount = charge.application_fee_amount;
        const stripeFee = Math.round(
          amount * 0.029 + 30 + (applicationFeeAmount * 0.029 + 30),
        );
        // Stripe fee calculation
        const connectCollectedFees =
          applicationFeeAmount - amount * YOUR_COMMISSION_RATE; // Replace YOUR_COMMISSION_RATE with your actual rate

        const netAmount = amount - stripeFee - connectCollectedFees;
        chargeDataArray[dateKey] += netAmount;
        successfulChargeCount++;
      }

      // Retrieve the next page of charges
      stripeConfig1.starting_after =
        chargesLists.data[chargesLists.data.length - 1].id;
      if (accountId) {
        chargesLists = await this.stripeClient.charges.list(stripeConfig1, {
          stripeAccount: accountId,
        });
      } else {
        chargesLists = await this.stripeClient.charges.list(stripeConfig1);
      }
    }

    if (!accountId) {
      // Retrieve the first page of application fees for the last 12 months
      let applicationFees = await this.stripeClient.applicationFees.list({
        created: {
          gte: startDate.unix(),
          lte: endDate.unix(),
        },
        limit: 1000,
      });

      // Sum up the application fee amounts from all pages
      while (applicationFees.data.length > 0) {
        for (const fee of applicationFees.data) {
          const dateKey = moment
            .unix(fee.created)
            .tz(Timezone)
            .format('YYYY-MM-DD');

          if (!feeDataArray[dateKey]) {
            feeDataArray[dateKey] = 0;
          }

          if (fee.amount_refunded == 0 && fee.currency == 'usd') {
            feeDataArray[dateKey] += fee.amount;
          } else {
            const balanceTransaction =
              await this.stripeClient.balanceTransactions.retrieve(
                String(fee.balance_transaction),
              );
            const exchangeRate = balanceTransaction.exchange_rate;
            const convertedAmount = Math.round(fee.amount * exchangeRate);
            feeDataArray[dateKey] += convertedAmount;
          }
        }

        // Retrieve the next page of application fees
        applicationFees = await this.stripeClient.applicationFees.list({
          created: {
            gte: startDate.unix(),
            lte: endDate.unix(),
          },
          limit: 1000,
          starting_after:
            applicationFees.data[applicationFees.data.length - 1].id,
        });
      }
    }

    return {
      chargeDataArray: chargeDataArray,
      feeDataArray: feeDataArray,
      successCount: successfulChargeCount,
    };
  }

  async getSalesCommissions(
    startDate: any,
    endDate: any,
    granularity: string,
    accountId?: string,
  ): Promise<any> {
    try {
      let successfulChargeCount = 0;
      const _chargeDataArray = {};

      let chargesLists;
      if (accountId) {
        chargesLists = await this._dbService.commission_payments.findMany({
          where: {
            created_at: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
            commission_id: accountId,
          },
        });
      }

      for (const charge of chargesLists) {
        let dateKey = moment(charge?.created_at)
          .tz(Timezone)
          .format('YYYY-MM-DD');
        if (granularity == 'today') {
          dateKey = moment(charge?.created_at)
            .tz(Timezone)
            .format('YYYY-MM-DD HH:00');
        }

        if (!_chargeDataArray[dateKey]) {
          _chargeDataArray[dateKey] = 0;
        }

        const amount = charge?.amount;
        const netAmount = amount;
        _chargeDataArray[dateKey] += netAmount;
        successfulChargeCount++;
      }

      return {
        chargeDataArray: { ..._chargeDataArray },
        feeDataArray: null,
        successCount: successfulChargeCount,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async getSuperAdminFeesAndCharges(
    startDate: any,
    endDate: any,
    granularity: string,
    accountId?: string,
    stripeAccountId?: string,
  ): Promise<any> {
    try {
      let successfulChargeCount = 0;
      const _chargeDataArray = {};
      const _feeDataArray = {};
      const today = moment().tz(Timezone);
      const startOfToday = today.clone().startOf('day');
      const endOfToday = today.clone();
      let todayCharges = {};
      let todayFees = {};

      //fetch today's data if edn date is today
      if (await this.isToday(new Date(endDate.unix() * 1000)) == true) {
        const { chargeDataArray, feeDataArray, successCount } =
          await this.getFeeAndCharges(startOfToday, endOfToday, granularity, stripeAccountId);
        todayCharges = chargeDataArray;
        todayFees = feeDataArray;
      }

      let chargesLists;
      if (accountId) {
        chargesLists = await this._dbService.adminCharges.findMany({
          where: {
            created_at_unix: {
              gte: startDate.unix(),
              lte: endDate.unix(),
            },
            status: 'succeeded',
            userId: accountId
          },
        });
      } else {
        chargesLists = await this._dbService.superAdminCharges.findMany({
          where: {
            created_at_unix: {
              gte: startDate.unix(),
              lte: endDate.unix(),
            },
            status: 'succeeded',
          },
        });
      }

      const YOUR_COMMISSION_RATE = 0;
      // Sum up the charges amounts from all pages
      for (const charge of chargesLists) {
        let dateKey = moment
          .unix(Number(charge?.created_at_unix))
          .tz(Timezone)
          .format('YYYY-MM-DD');
        if (granularity == 'today') {
          dateKey = moment
            .unix(Number(charge?.created_at_unix))
            .tz(Timezone)
            .format('YYYY-MM-DD HH:00');
        }

        if (!_chargeDataArray[dateKey]) {
          _chargeDataArray[dateKey] = 0;
        }

        const amount = charge?.amount;
        let applicationFeeAmount = charge?.fee;

        if (!accountId) {
          applicationFeeAmount = 0;
        }

        const stripeFee = Math.round(
          amount * 0.029 + 30,
        );
        // Stripe fee calculation
        let connectCollectedFees =
          applicationFeeAmount - amount * YOUR_COMMISSION_RATE; // Replace YOUR_COMMISSION_RATE with your actual rate

        if (!accountId) {
          connectCollectedFees = 0;
        }

        const netAmount = amount - stripeFee - connectCollectedFees;
        _chargeDataArray[dateKey] += netAmount;
        successfulChargeCount++;
      }

      if (!accountId) {
        // Retrieve the first page of application fees

        let applicationFees = await this._dbService.superAdminFees.findMany({
          where: {
            created_at_unix: {
              gte: startDate.unix(),
              lte: endDate.unix(),
            },
          },
        });

        for (const fee of applicationFees) {
          let dateKey = moment
            .unix(Number(fee?.created_at_unix))
            .tz(Timezone)
            .format('YYYY-MM-DD');
          if (granularity == 'today') {
            dateKey = moment
              .unix(Number(fee?.created_at_unix))
              .tz(Timezone)
              .format('YYYY-MM-DD HH:00');
          }

          if (!_feeDataArray[dateKey]) {
            _feeDataArray[dateKey] = 0;
          }

          _feeDataArray[dateKey] += fee?.amount;
        }
      }
      return {
        chargeDataArray: { ..._chargeDataArray, ...todayCharges },
        feeDataArray: { ..._feeDataArray, ...todayFees },
        successCount: successfulChargeCount,
      };
    }
    catch (error: any) {

    }
  }

  async getFeeAndCharges(
    startDate: any,
    endDate: any,
    granularity: string,
    accountId?: string,
  ): Promise<any> {
    const today = moment().tz(Timezone);
    let successfulChargeCount = 0;

    const chargeDataArray = {};
    const feeDataArray = {};

    const stripeConfig1: any = {
      created: {
        gte: startDate.unix(),
        lte: endDate.unix(),
      },
      limit: 100,
    };

    let chargesLists;
    if (accountId) {
      chargesLists = await this.stripeClient.charges.list(stripeConfig1, {
        stripeAccount: accountId,
      });
    } else {
      chargesLists = await this.stripeClient.charges.list(stripeConfig1);
    }

    const YOUR_COMMISSION_RATE = 0;
    // Sum up the charges amounts from all pages
    while (chargesLists.data.length > 0) {
      for (const charge of chargesLists.data) {
        let dateKey = moment
          .unix(charge.created)
          .tz(Timezone)
          .format('YYYY-MM-DD');
        if (granularity == 'today') {
          dateKey = moment
            .unix(charge.created)
            .tz(Timezone)
            .format('YYYY-MM-DD HH:00');
        }

        if (!chargeDataArray[dateKey]) {
          chargeDataArray[dateKey] = 0;
        }

        let amount = charge.amount;
        let applicationFeeAmount = charge.application_fee_amount;
        if (charge.paid != true) {
          amount = 0;
          applicationFeeAmount = 0;
        }
        const stripeFee = Math.round(
          amount * 0.029 + 30 + (applicationFeeAmount * 0.029 + 30),
        );
        // Stripe fee calculation
        const connectCollectedFees =
          applicationFeeAmount - amount * YOUR_COMMISSION_RATE; // Replace YOUR_COMMISSION_RATE with your actual rate

        const netAmount = amount - stripeFee - connectCollectedFees;
        chargeDataArray[dateKey] += netAmount;
        successfulChargeCount++;
      }

      // Retrieve the next page of charges
      stripeConfig1.starting_after =
        chargesLists.data[chargesLists.data.length - 1].id;
      if (accountId) {
        chargesLists = await this.stripeClient.charges.list(stripeConfig1, {
          stripeAccount: accountId,
        });
      } else {
        chargesLists = await this.stripeClient.charges.list(stripeConfig1);
      }
    }

    if (!accountId) {
      // Retrieve the first page of application fees
      let applicationFees = await this.stripeClient.applicationFees.list({
        created: {
          gte: startDate.unix(),
          lte: endDate.unix(),
        },
        limit: 100,
      });

      // Sum up the application fee amounts from all pages
      while (applicationFees.data.length > 0) {
        for (const fee of applicationFees.data) {
          let dateKey = moment
            .unix(fee.created)
            .tz(Timezone)
            .format('YYYY-MM-DD');
          if (granularity == 'today') {
            dateKey = moment
              .unix(fee.created)
              .tz(Timezone)
              .format('YYYY-MM-DD HH:00');
          }

          if (!feeDataArray[dateKey]) {
            feeDataArray[dateKey] = 0;
          }

          if (fee.amount_refunded == 0 && fee.currency == 'usd') {
            feeDataArray[dateKey] += fee.amount;
          } else {
            const balanceTransaction =
              await this.stripeClient.balanceTransactions.retrieve(
                String(fee.balance_transaction),
              );
            const exchangeRate = balanceTransaction.exchange_rate;
            const convertedAmount = Math.round(fee.amount * exchangeRate);
            feeDataArray[dateKey] += convertedAmount;
          }

        }

        // Retrieve the next page of application fees
        applicationFees = await this.stripeClient.applicationFees.list({
          created: {
            gte: startDate.unix(),
            lte: endDate.unix(),
          },
          limit: 100,
          starting_after:
            applicationFees.data[applicationFees.data.length - 1].id,
        });
      }
    }
    return {
      chargeDataArray: chargeDataArray,
      feeDataArray: feeDataArray,
      successCount: successfulChargeCount,
    };
  }

  async getNewSalesCustomers(
    timeRange: string,
    custom: any,
    account_id: string,
  ): Promise<any> {
    let startDate: any = '';
    let endDate: any = '';
    timeRange = timeRange.toLowerCase();

    if (timeRange == 'custom') {
      startDate = moment(custom?.startDate).tz(Timezone);
      endDate = moment(custom?.endDate).tz(Timezone);
    }

    if (timeRange != 'custom') {
      startDate = await this.getStartEndDate(timeRange).startDate;
      endDate = await this.getStartEndDate(timeRange).endDate;
    }

    startDate = moment(new Date((new Date(startDate)?.getMonth() + 1) + "/" + (new Date(startDate)?.getDate() + 1) + "/" + new Date(startDate)?.getFullYear())).tz(Timezone).startOf('day');
    endDate = moment(new Date((new Date(endDate)?.getMonth() + 1) + "/" + (new Date(endDate)?.getDate() + 1) + "/" + new Date(endDate)?.getFullYear())).tz(Timezone).endOf('day');

    let granularity = 'day';

    if (
      timeRange == 'last 12 months' ||
      timeRange == 'year to date' ||
      'all time'
    ) {
      granularity = 'month';
    }

    if (timeRange == 'today') {
      granularity = 'today';
    }

    let customersLists;

    if (account_id) {
      customersLists = await this._dbService.subscriptions.findMany({
        where: {
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          referred_by: account_id,
        },
        include: {
          User: true,
        },
      });
    }

    const customerDataArray = {};

    if (customersLists.length) {
      for (const customer of customersLists) {
        let dateKey = moment(customer.created_at)
          .tz(Timezone)
          .format('YYYY-MM-DD');
        if (granularity == 'today') {
          dateKey = moment(customer.created_at)
            .tz(Timezone)
            .format('YYYY-MM-DD HH:00');
        }

        if (!customerDataArray[dateKey]) {
          customerDataArray[dateKey] = 0;
        }

        customerDataArray[dateKey]++;
      }
    }

    if (granularity == 'today') {
      const newCustomersArray = [];

      for (
        let currentTime = startDate;
        currentTime.isBefore(endDate);
        currentTime.add(1, 'hour')
      ) {
        const dateKey = moment
          .unix(currentTime.unix())
          .tz(Timezone)
          .format('YYYY-MM-DD HH:00');

        newCustomersArray.push({
          date: dateKey,
          newCustomers: customerDataArray[dateKey] ?? 0,
        });
      }

      const totalNewCustomers = newCustomersArray.reduce(
        (sum, netVolumeArray) => sum + netVolumeArray?.newCustomers,
        0,
      );

      return { data: newCustomersArray, totalNetVolume: totalNewCustomers };
    }

    const allDateCustomerArray = {};
    let currentDate = startDate;
    while (currentDate <= endDate) {
      const dateKey = moment
        .unix(currentDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');

      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);

      allDateCustomerArray[dateKey] = customerDataArray[dateKey] ?? 0;
      currentDate = currentDate.add(1, 'days');
    }

    const customerArray = [];
    let totalNewCustomer = 0;
    for (const key in allDateCustomerArray) {
      if (allDateCustomerArray.hasOwnProperty(key)) {
        totalNewCustomer += allDateCustomerArray[key];
        customerArray.push({
          date: key,
          newCustomers: allDateCustomerArray[key],
        });
      }
    }
    console.log(customerArray);
    return { data: customerArray, totalNetVolume: totalNewCustomer };
  }

  async getNewCustomer(
    timeRange: string,
    custom: any,
    accountId: string,
    userId: string
  ): Promise<any> {
    let startDate: any = '';
    let endDate: any = '';
    timeRange = timeRange.toLowerCase();

    if (timeRange == 'custom') {
      startDate = moment(custom?.startDate).tz(Timezone);
      endDate = moment(custom?.endDate).tz(Timezone);
    }

    if (timeRange != 'custom') {
      startDate = await this.getStartEndDate(timeRange).startDate;
      endDate = await this.getStartEndDate(timeRange).endDate;
    }

    startDate = moment(new Date((new Date(startDate)?.getMonth() + 1) + "/" + (new Date(startDate)?.getDate() + 1) + "/" + new Date(startDate)?.getFullYear())).tz(Timezone).startOf('day');
    endDate = moment(new Date((new Date(endDate)?.getMonth() + 1) + "/" + (new Date(endDate)?.getDate() + 1) + "/" + new Date(endDate)?.getFullYear())).tz(Timezone).endOf('day');

    let granularity = 'day';

    if (
      timeRange == 'last 12 months' ||
      timeRange == 'year to date' ||
      'all time'
    ) {
      granularity = 'month';
    }

    if (timeRange == 'today') {
      granularity = 'today';
    }

    const today = moment().tz(Timezone);
    const startOfToday = today.clone().startOf('day');
    const endOfToday = today.clone();
    const stripeConfig: any = {
      created: {
        gte: accountId ? startOfToday.unix() : startDate?.unix(),
        lte: accountId ? endOfToday.unix() : endDate?.unix(),
      },
      limit: 100,
    };
    let customersLists;

    //fetch today's data if end date is today
    if (await this.isToday(new Date(endDate.unix() * 1000)) == true) {
      if (accountId) {
        customersLists = await this.stripeClient.customers.list(stripeConfig, {
          stripeAccount: accountId,
        });
      } else {
        customersLists = await this.stripeClient.customers.list(stripeConfig);
      }
    }

    let dbCustomers;

    if (accountId) {
      dbCustomers = await this._dbService.adminCustomers.findMany({
        where: {
          created_at_unix: {
            gte: startDate.unix(),
            lte: endDate.unix(),
          },
          userId: userId
        },
      })
    }

    const data = [];
    const todayCustomers = customersLists?.data?.length > 0 ? customersLists?.data : [];

    for (let i = 0; i < (todayCustomers?.length > 0 ? dbCustomers?.length - 1 : dbCustomers?.length); i++) {
      data.push(dbCustomers[i]);
    }
    for (let i = 0; i < customersLists?.data?.length; i++) {
      data.push(customersLists?.data[i]);
    }

    customersLists = {
      data: data
    }

    const customerDataArray = {};

    // Sum up the charges amounts from all pages
    while (customersLists.data.length > 0) {
      for (const customer of customersLists.data) {
        let dateKey = moment
          .unix(customer.created ? customer?.created : Number(customer?.created_at_unix))
          .tz(Timezone)
          .format('YYYY-MM-DD');
        if (granularity == 'today') {
          dateKey = moment
            .unix(customer.created ? customer?.created : Number(customer?.created_at_unix))
            .tz(Timezone)
            .format('YYYY-MM-DD HH:00');
        }

        if (!customerDataArray[dateKey]) {
          customerDataArray[dateKey] = 0;
        }

        customerDataArray[dateKey]++;
      }

      // Retrieve the next page of charges
      if (await this.isToday(new Date(endDate.unix() * 1000)) != true || todayCustomers?.length == 0) {
        break;
      }
      stripeConfig.starting_after =
        customersLists.data[customersLists.data.length - 1].id;
      if (accountId) {
        customersLists = await this.stripeClient.customers.list(stripeConfig, {
          stripeAccount: accountId,
        });
      } else {
        customersLists = await this.stripeClient.customers.list(stripeConfig);
      }
    }

    if (granularity == 'today') {
      const netVolumeArray = [];

      for (
        let currentTime = startDate;
        currentTime.isBefore(endDate);
        currentTime.add(1, 'hour')
      ) {
        const dateKey = moment
          .unix(currentTime.unix())
          .tz(Timezone)
          .format('YYYY-MM-DD HH:00');

        netVolumeArray.push({
          date: dateKey,
          newCustomers: customerDataArray[dateKey] ?? 0,
        });
      }

      const totalNetVolume = netVolumeArray.reduce(
        (sum, netVolumeArray) => sum + netVolumeArray?.newCustomers,
        0,
      );
      return { data: netVolumeArray, totalNetVolume: totalNetVolume };
    }

    const allDateCustomerArray = {};
    let currentDate = startDate;
    while (currentDate <= endDate) {
      const dateKey = moment
        .unix(currentDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');

      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);

      allDateCustomerArray[dateKey] = customerDataArray[dateKey] ?? 0;
      currentDate = currentDate.add(1, 'days');
    }

    const customerArray = [];
    let totalNewCustomer = 0;
    for (const key in allDateCustomerArray) {
      if (allDateCustomerArray.hasOwnProperty(key)) {
        totalNewCustomer += allDateCustomerArray[key];
        customerArray.push({
          date: key,
          newCustomers: allDateCustomerArray[key],
        });
      }
    }

    return { data: customerArray, totalNetVolume: totalNewCustomer };
  }

  private getStartEndDate(timeRange: string): Date | any {
    const today = moment().tz(Timezone);
    let startDate: moment.Moment;
    let endDate: moment.Moment;
    const limitDate = moment.tz('2022-06-01', Timezone);
    const earliestDate = moment.tz('2020-01-01', Timezone);

    switch (timeRange.toLowerCase()) {
      case 'today':
        startDate = today.clone().startOf('day');
        endDate = today.clone();
        break;
      case 'last 7 days':
        startDate = (today.clone().subtract(7, 'days').startOf('day')).clone().add(1, 'day');
        endDate = today.clone();
        break;
      case 'last 4 weeks':
        startDate = (today.clone().subtract(4, 'weeks').startOf('day')).clone().add(1, 'day');
        endDate = today.clone();
        break;
      case 'last 3 months':
        startDate = today.clone().subtract(3, 'months').startOf('day');
        endDate = today.clone();
        break;
      case 'last 12 months':
        //updated due to hacking attack
        startDate = today.clone().subtract(12, 'months').startOf('day');
        // startDate = limitDate.clone().startOf('day');
        endDate = today.clone();
        break;
      case 'month to date':
        startDate = today.clone().startOf('month');
        endDate = today.clone();
        break;
      case 'quarter to date':
        startDate = today.clone().startOf('quarter');
        endDate = today.clone();
        break;
      case 'year to date':
        startDate = today.clone().startOf('year');
        endDate = today.clone();
        break;
      case 'all time':
        startDate = earliestDate.clone().startOf('day');
        endDate = today.clone();
        break;
      default:
        throw new Error('Invalid time range');
    }

    return { startDate: startDate, endDate: endDate };
  }

  async getStatistics(): Promise<any> {
    try {
      const { startDate, endDate } = await this.getStartEndDate(
        'last 12 months',
      );

      const dateKey = moment
        .unix(startDate.unix())
        .tz(Timezone)
        .format('YYYY-MM-DD');
      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);

      const total = await prisma.netVolumeSales.aggregate({
        where: {
          date: {
            gte: startDate.toDate(),
          },
        },
        _sum: {
          fee: true,
          charge: true,
        },
      });

      const totalCollectedFee = total._sum.fee / 100;
      const totalCharge = total._sum.charge / 100;

      return {
        totalCollectedFee: totalCollectedFee,
        grossNetVolume: totalCharge + totalCollectedFee,
      };
    } catch (error) {
      throw new BadRequestException('Failed to get Statistics');
    }
  }

  async createOneTimeSession(
    name: string,
    email: string,
    code: string,
    payment_method: string,
    payment_plan: string,
    payment_period: string,
  ): Promise<any> {
    const priceId = getPriceIdByPlan(payment_plan, payment_period);
    const offerPriceId = getOfferPriceIdByPlan(payment_plan, payment_period);
    if (!priceId || !offerPriceId) {
      throw new BadRequestException('Failed to get payment price');
    }

    const customer_options: Customer = {
      name,
      email,
      payment_method,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    };

    const customer = await this.stripeClient.customers.create(customer_options);

    const trialDaysLater = moment().add(7, 'days').unix();
    let coupon = '';
    if (code) {
      const promoExists = await this.stripeClient.promotionCodes.list({
        code,
        limit: 1,
      });
      if (promoExists.data) {
        coupon = promoExists.data[0].coupon.id;
      }
    }

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: 2200,
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
      payment_method: payment_method,
      setup_future_usage: 'off_session',
      metadata: {
        coupon: code,
      },
    });

    if (paymentIntent) {
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new BadRequestException('Failed to create subscription');
      }
      const data = {
        id: user.id,
        payment_plan,
        payment_period,
        subscription_id: paymentIntent.id,
        signup_status: 'completed',
      };
      const updatedUser = this.usersService.updateOwner(data);
      if (!updatedUser) {
        throw new BadRequestException('Failed to update user');
      }
      this.eventEmitter.emit('appowner.subscription.created');
      return {
        subscription_id: paymentIntent.id,
      };
    } else {
      throw new BadRequestException('Failed to subscribe to plan');
    }
  }

  async createSubscription(
    name: string,
    email: string,
    code: string,
    payment_method: string,
    payment_plan: string,
    payment_period: string,
  ): Promise<any> {
    const priceId = getPriceIdByPlan(payment_plan, payment_period);
    const offerPriceId = getOfferPriceIdByPlan(payment_plan, payment_period);
    if (!priceId || !offerPriceId) {
      throw new BadRequestException('Failed to get payment price');
    }

    const customer_options: Customer = {
      name,
      email,
      payment_method,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    };

    /** Test clock */
    // if (process.env.FROZEN_TIME != null) {
    //   const test_clock = await this.stripeClient.testHelpers.testClocks.create({
    //     frozen_time: parseInt(process.env.FROZEN_TIME),
    //     name: 'Monthly renewal',
    //   });

    //   customer_options.test_clock = test_clock.id;
    // }

    const customer = await this.stripeClient.customers.create(customer_options);

    const offerDate = payment_period === 'Monthly'
      ? moment().add(3, 'months').unix()
      : moment().add(1, 'years').unix();
    const oneTimeStartDate = moment().add(1, 'months').unix();
    const oneTimeEndDate = moment().add(6, 'months').unix();
    let coupon = '';
    if (code) {
      const promoExists = await this.stripeClient.promotionCodes.list({
        code,
        limit: 1,
      });
      if (promoExists.data) {
        coupon = promoExists.data[0].coupon.id;
      }
    }

    const phases: Array<Stripe.SubscriptionScheduleCreateParams.Phase> = payment_plan === 'Business' ? [
      {
        items: [{ price: offerPriceId }],
        end_date: oneTimeStartDate,
        // trial_end: trialDaysLater,
        ...(coupon ? { coupon: coupon } : {}),
      },
      {
        items: [{ price: process.env.STRIPE_PLAN_FREE }],
        end_date: oneTimeEndDate,
      },
      {
        items: [{ price: priceId }],
        ...(coupon ? { coupon: coupon } : {}),
      },
    ] : [
      {
        items: [{ price: offerPriceId }],
        end_date: offerDate,
        // trial_end: trialDaysLater,
        ...(coupon ? { coupon: coupon } : {}),
      },
      {
        items: [{ price: priceId }],
        ...(coupon ? { coupon: coupon } : {}),
      },
    ]

    const schedule = await this.stripeClient.subscriptionSchedules.create({
      customer: customer.id,
      start_date: moment().unix(),
      phases,
    });

    if (schedule) {
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new BadRequestException('Failed to create subscription');
      }
      const data = {
        id: user.id,
        payment_plan,
        payment_period,
        subscription_id: schedule.subscription,
        signup_status: 'completed',
      };
      const updatedUser = this.usersService.updateOwner(data);
      if (!updatedUser) {
        throw new BadRequestException('Failed to update user');
      }
      this.eventEmitter.emit('appowner.subscription.created');
      return {
        subscription_id: schedule.subscription,
      };
    } else {
      throw new BadRequestException('Failed to subscribe to plan');
    }
  }

  async updateSubscription(
    userId: string,
    payment_plan: string,
    payment_period: string,
  ): Promise<any> {
    const user = await this.usersService.getUserById(userId);
    if (!user || !user.subscription_id) {
      throw new BadRequestException('Failed to get User');
    }

    const oldSubscription = await this.stripeClient.subscriptions.del(
      user.subscription_id,
    );
    if (!oldSubscription) {
      throw new BadRequestException('Failed to get cancel subscription');
    }

    return this.reactivateSubscription(userId, payment_plan, payment_period);
  }

  async cancelSubscriptionByUserId(userId: string): Promise<any> {
    const user = await this.usersService.getUserById(userId);
    if (!user || !user.subscription_id) {
      throw new BadRequestException('Failed to get User');
    }

    const subscription = await this.stripeClient.subscriptions.del(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException('Failed to get cancel subscription');
    }
    if (subscription.status === 'canceled') {
      const data = {
        id: userId,
        payment_plan: '',
      };
      const updatedUser = this.usersService.updateOwner(data);
      if (!updatedUser) {
        throw new BadRequestException('Failed to update user');
      }
      return {};
    }
  }

  async reactivateSubscription(
    userId: string,
    payment_plan: string,
    payment_period: string,
  ): Promise<any> {
    const priceId = getPriceIdByPlan(payment_plan, payment_period);
    if (priceId === '') {
      throw new BadRequestException('Failed to get payment price');
    }

    const user = await this.usersService.getUserById(userId);
    if (!user || !user.subscription_id) {
      throw new BadRequestException('Failed to get User');
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException('Failed to get original subscription');
    }

    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await this.stripeClient.customers.retrieve(
      subscription.customer.toString(),
    );
    if (!customerResponse || customerResponse.deleted) {
      throw new BadRequestException(
        `Failed to get customer info or deleted customer`,
      );
    }

    const customer = customerResponse as Stripe.Response<Stripe.Customer>;
    const paymentMethod = await this.stripeClient.paymentMethods.retrieve(
      customer.invoice_settings.default_payment_method.toString(),
    );
    if (!paymentMethod) {
      throw new BadRequestException(`Failed to get payment method`);
    }

    const newSubscription = await this.stripeClient.subscriptions.create({
      customer: String(subscription.customer),
      items: [{ price: priceId }],
      default_payment_method: paymentMethod.id,
      payment_settings: {
        payment_method_types: ['card'],
      },
    });
    if (
      newSubscription.status === 'active' ||
      newSubscription.status === 'trialing'
    ) {
      const data = {
        id: userId,
        payment_plan,
        payment_period,
        subscription_id: newSubscription.id,
      };
      const updatedUser = this.usersService.updateOwner(data);
      if (!updatedUser) {
        throw new BadRequestException('Failed to reactivate subscription');
      }
      return {};
    }
  }

  async extendSubscriptionByUserId(
    userId: string,
    extendType: string,
  ): Promise<any> {
    if (!['trial', 'reduce'].includes(extendType)) {
      throw new BadRequestException('Bad request');
    }

    const user = await this.usersService.getUserById(userId);
    if (!user || !user.subscription_id) {
      throw new BadRequestException('Failed to get User');
    }

    const originalPriceId = getPriceIdByPlan(user.payment_plan, user.payment_period);
    const extendPriceId = process.env.STRIPE_PLAN_EXTEND_MONTHLY;
    if (!extendPriceId || !originalPriceId) {
      throw new BadRequestException('Failed to get price');
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException('Failed to get original subscription');
    }

    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await this.stripeClient.customers.retrieve(
      subscription.customer.toString(),
    );
    if (!customerResponse || customerResponse.deleted) {
      throw new BadRequestException(
        `Failed to get customer info or deleted customer`,
      );
    }

    const customer = customerResponse as Stripe.Response<Stripe.Customer>;
    const paymentMethod = await this.stripeClient.paymentMethods.retrieve(
      customer.invoice_settings.default_payment_method.toString(),
    );
    if (!paymentMethod) {
      throw new BadRequestException(`Failed to get payment method`);
    }

    const oldSubscription = await this.stripeClient.subscriptions.del(
      user.subscription_id,
    );
    if (!oldSubscription) {
      throw new BadRequestException('Failed to get cancel subscription');
    }

    const trialDaysLater = moment().add(14, 'days').unix();
    const reduceEndDate = moment().add(14, 'days').add(3, 'months').unix();
    if (extendType === 'trial') {
      const newSubscription = await this.stripeClient.subscriptions.create({
        customer: String(subscription.customer),
        items: [{ price: originalPriceId }],
        default_payment_method: paymentMethod.id,
        payment_settings: {
          payment_method_types: ['card'],
        },
        trial_period_days: 14,
      });

      if (
        newSubscription.status === 'active' ||
        newSubscription.status === 'trialing'
      ) {
        const data = {
          id: userId,
          subscription_id: newSubscription.id,
        };
        const updatedUser = this.usersService.updateOwner(data);
        if (!updatedUser) {
          throw new BadRequestException('Failed to reactivate subscription');
        }
      }
    } else if (extendType === 'reduce') {
      const schedule = await this.stripeClient.subscriptionSchedules.create({
        customer: customer.id,
        start_date: moment().unix(),
        phases: [
          {
            items: [{ price: extendPriceId }],
            end_date: reduceEndDate,
            trial_end: trialDaysLater,
          },
          {
            items: [{ price: originalPriceId }],
          },
        ],
      });

      const data = {
        id: userId,
        subscription_id: schedule.subscription,
      };
      const updatedUser = this.usersService.updateOwner(data);
      if (!updatedUser) {
        throw new BadRequestException('Failed to update user');
      }
    }

    return {};
  }

  async getDiscountByCode(code: string) {
    const promoExists = await this.stripeClient.promotionCodes.list({ code: code.toLowerCase() });
    if (!promoExists.data) {
      throw new BadRequestException(`No promotion exist for code ${code}`);
    }

    if (code.toLowerCase() === 'thumper2019') {
      return {
        free: true,
      };
    }

    if (!promoExists.data[0].coupon.valid) {
      throw new BadRequestException(`The promotion code ${code} is invalid`);
    }

    return {
      amount: promoExists.data[0].coupon.amount_off,
      percent: promoExists.data[0].coupon.percent_off,
    };
  }

  async getPlanPrices(): Promise<any> {
    const [
      basic_annual,
      basic_annual_offer,
      basic_monthly,
      basic_monthly_offer,
      business_annual,
      business_annual_offer,
      business_monthly,
      business_monthly_offer,
      professional_monthly,
      professional_monthly_offer,
    ] =
      await Promise.all([
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BASIC_ANNUAL),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BASIC_ANNUAL_OFFER),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BASIC_MONTHLY),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BASIC_MONTHLY_OFFER),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BUSINESS_ANNUAL),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BUSINESS_ANNUAL_OFFER),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BUSINESS_MONTHLY),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_BUSINESS_MONTHLY_OFFER),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_PROFESSIONAL_MONTHLY),
        this.stripeClient.prices.retrieve(process.env.STRIPE_PLAN_PROFESSIONAL_MONTHLY_OFFER),
      ]);

    return {
      basic_annual: basic_annual.unit_amount / 100,
      basic_annual_offer: basic_annual_offer.unit_amount / 100,
      basic_monthly: basic_monthly.unit_amount / 100,
      basic_monthly_offer: basic_monthly_offer.unit_amount / 100,
      business_annual: business_annual.unit_amount / 100,
      business_annual_offer: business_annual_offer.unit_amount / 100,
      business_monthly: business_monthly.unit_amount / 100,
      business_monthly_offer: business_monthly_offer.unit_amount / 100,
      professional_monthly: professional_monthly.unit_amount / 100,
      professional_monthly_offer: professional_monthly_offer.unit_amount / 100,
    };
  }

  async getPaymentMethodByUserId(userId: string): Promise<any> {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new BadRequestException(`Failed to get user info`);
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException(`Failed to get subscription info`);
    }

    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await this.stripeClient.customers.retrieve(
      subscription.customer.toString(),
    );
    if (!customerResponse || customerResponse.deleted) {
      throw new BadRequestException(
        `Failed to get customer info or deleted customer`,
      );
    }

    const customer = customerResponse as Stripe.Response<Stripe.Customer>;

    const paymentMethod = await this.stripeClient.paymentMethods.retrieve(
      customer.invoice_settings.default_payment_method.toString(),
    );
    if (!paymentMethod) {
      throw new BadRequestException(`Failed to get payment method`);
    }
    return paymentMethod;
  }

  async updatePaymentMethodByUserId(
    userId: string,
    payment_method: string,
  ): Promise<any> {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new BadRequestException(`Failed to get user info`);
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException(`Failed to get subscription info`);
    }

    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await this.stripeClient.customers.retrieve(
      subscription.customer.toString(),
    );
    if (!customerResponse || customerResponse.deleted) {
      throw new BadRequestException(
        `Failed to get customer info or deleted customer`,
      );
    }

    const customer = customerResponse as Stripe.Response<Stripe.Customer>;
    const attachPaymentMethod = await this.stripeClient.paymentMethods.attach(
      payment_method,
      { customer: customer.id },
    );
    if (!attachPaymentMethod) {
      throw new BadRequestException(`Failed to attach payment`);
    }

    const updatedCustomer = await this.stripeClient.customers.update(
      customer.id,
      {
        invoice_settings: {
          default_payment_method: payment_method,
        },
      },
    );
    if (!updatedCustomer) {
      throw new BadRequestException(`Failed to update customer`);
    }

    const updatedSubscription = await this.stripeClient.subscriptions.update(
      subscription.id,
      { default_payment_method: payment_method },
    );
    if (!updatedSubscription) {
      throw new BadRequestException(`Failed to update subscription`);
    }
    return {};
  }

  async getBillingInfoByUserId(userId: string): Promise<any> {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new BadRequestException(`Failed to get user info`);
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException(`Failed to get subscription info`);
    }

    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await this.stripeClient.customers.retrieve(
      subscription.customer.toString(),
    );
    if (!customerResponse || customerResponse.deleted) {
      throw new BadRequestException(
        `Failed to get customer info or deleted customer`,
      );
    }

    const customer = customerResponse as Stripe.Response<Stripe.Customer>;
    return {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    };
  }

  async updateBillingInfoByUserId(
    userId: string,
    name: string,
    line1: string,
    line2: string,
    city: string,
    country: string,
    postal: string,
  ): Promise<any> {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new BadRequestException(`Failed to get user info`);
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      user.subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException(`Failed to get subscription info`);
    }

    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await this.stripeClient.customers.retrieve(
      subscription.customer.toString(),
    );
    if (!customerResponse || customerResponse.deleted) {
      throw new BadRequestException(
        `Failed to get customer info or deleted customer`,
      );
    }

    const customer = customerResponse as Stripe.Response<Stripe.Customer>;
    const updatedCustomer = await this.stripeClient.customers.update(
      customer.id,
      {
        name,
        address: {
          line1,
          line2,
          city,
          country,
          postal_code: postal,
        },
      },
    );
    return updatedCustomer;
  }

  async getStatusAndRemainDays(subscription_id: string | null): Promise<any> {
    if (!subscription_id) {
      return {
        status: null,
        remain: 0,
      };
    } else if (subscription_id === 'free') {
      return {
        status: 'free',
        remain: 0,
      };
    }

    const subscription = await this.stripeClient.subscriptions.retrieve(
      subscription_id,
    );
    if (!subscription) {
      throw new BadRequestException(`Failed to get subscription info`);
    }
    const remain = subscription.status === 'past_due' || subscription.status === 'unpaid'
      ? PAYMENT_TOTAL_FIX_DAYS + DiffBetweenTwoDates(Now(), subscription.current_period_start * 1000)
      : 0;

    return {
      status: subscription.status,
      remain,
    };
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error.statusCode === 429 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.withRetry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  async getPlatformAccounts(): Promise<any> {
    try {
      const allAccounts = [];
      for await (const account of this.stripeClient.accounts.list({
        limit: 100,
      })) {
        allAccounts.push(account);
      }

      return allAccounts;
    } catch (error: any) {
      throw error;
    }
  }

  async recentlyPaidOut(id: string): Promise<any> {
    try {
      const stripe = await this._dbService.stripeConnect.findFirst({
        where: { stripeAccountId: id },
      });
      if (stripe) {
        const res = await this.stripeClient.payouts.list(
          { limit: 1 },
          { stripeAccount: id },
        );
        return res?.data[0];
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getBalance(id: string): Promise<any> {
    try {
      const stripe = await this._dbService.stripeConnect.findFirst({
        where: { stripeAccountId: id },
      });
      if (stripe) {
        return await this.stripeClient.balance.retrieve({
          stripeAccount: id,
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // saving super admin charges
  @Cron('00 00 * * *', { timeZone: Timezone })
  async saveSuperAdminCharges(): Promise<any> {
    const unix_time_of_2022_0601 = 1654032000
    try {
      const lastChargeChargeId = await prisma.superAdminCharges.findFirst({
        orderBy: {
          created_at_unix: 'desc',
        },
      });

      const options: any = {
        limit: 100,
        ...(lastChargeChargeId?.created_at_unix ? { created: { gte: Number(lastChargeChargeId.created_at_unix) + 1 > unix_time_of_2022_0601 ? Number(lastChargeChargeId.created_at_unix) + 1 : unix_time_of_2022_0601 } } : {}),
      };

      const allCharges = [];
      const charges = await this.stripeClient.charges.list(options);

      allCharges.push(...charges.data);
      let hasMore = charges.has_more;
      let lastItem = charges.data.slice(-1)[0]?.id;

      while (hasMore) {
        const moreCharges = await this.stripeClient.charges.list({
          limit: 100,
          ...(lastChargeChargeId?.created_at_unix ? { created: { gte: Number(lastChargeChargeId.created_at_unix) + 1 > unix_time_of_2022_0601 ? Number(lastChargeChargeId.created_at_unix) + 1 : unix_time_of_2022_0601 } } : {}),
          starting_after: lastItem,
        });

        allCharges.push(...moreCharges.data);
        hasMore = moreCharges.has_more;
        lastItem = moreCharges.data.slice(-1)[0]?.id;
      }

      const chargesArrayPromises = allCharges?.reverse()
        .map(async (charge: any) => {
          let convertedAmount: any = 0;
          if (charge.currency != 'usd' && charge?.balance_transaction != null) {
            const balanceTransaction =
              await this.stripeClient.balanceTransactions.retrieve(
                String(charge?.balance_transaction),
              );
            const exchangeRate = balanceTransaction.exchange_rate;
            convertedAmount = Math.round(charge.amount * exchangeRate);
          } else {
            convertedAmount = Number(charge?.amount);
          }
          return {
            amount: convertedAmount,
            currency: charge?.currency,
            amount_origin: Number(charge?.amount),
            transactionId: charge?.balance_transaction,
            status: charge?.status,
            created_at_unix: charge?.created,
            date: moment.tz(moment.unix(charge?.created).tz(Timezone).format('YYYY-MM-DD'), Timezone).toDate(),
            customerId: charge?.customer,
            email: charge?.billing_details?.email,
            chargeId: charge?.id,
          };
        });

      const chargesArray = await Promise.all(chargesArrayPromises);
      await this._dbService.superAdminCharges.createMany({
        data: chargesArray,
      });

      return 'Lifetime update was successful';
    } catch (error: any) {
      console.log(error);
    }
  }

  //saving superadmin fees
  @Cron('00 01 * * *', { timeZone: Timezone })
  async saveSuperAdminFees(): Promise<any> {
    try {
      const unix_time_of_2022_0601 = 1654032000
      const lastFeeFeeId = await prisma.superAdminFees.findFirst({
        orderBy: {
          created_at_unix: 'desc',
        },
      });

      const options: any = {
        limit: 100,
        ...(lastFeeFeeId?.created_at_unix ? { created: { gte: Number(lastFeeFeeId.created_at_unix) + 1 > unix_time_of_2022_0601 ? Number(lastFeeFeeId.created_at_unix) + 1 : unix_time_of_2022_0601 } } : {}),
      };

      const accounts: any = await this._dbService.stripeConnect.findMany({});

      const allFees = [];
      const fees = await this.withRetry(() => this.stripeClient.applicationFees.list(options));
      allFees.push(...fees.data);
      let hasMore = fees.has_more;
      let lastItem = fees.data.slice(-1)[0]?.id;

      while (hasMore) {
        const moreFees = await this.withRetry(() => this.stripeClient.applicationFees.list({
          limit: 100,
          ...(lastFeeFeeId?.created_at_unix ? { created: { gte: Number(lastFeeFeeId.created_at_unix) + 1 > unix_time_of_2022_0601 ? Number(lastFeeFeeId.created_at_unix) + 1 : unix_time_of_2022_0601 } } : {}),
          starting_after: lastItem,
        }));

        allFees.push(...moreFees.data);
        hasMore = moreFees.has_more;
        lastItem = moreFees.data.slice(-1)[0]?.id;
      }

      const feesArrayPromises = allFees?.reverse().map(async (fee: any) => {
        const userId = accounts?.filter(
          (account) => account?.stripeAccountId == fee?.account,
        );

        let convertedAmount = 0;
        if (fee.currency != 'usd' && fee?.balance_transaction != null) {

          const balanceTransaction =
            await this.withRetry(() => this.stripeClient.balanceTransactions.retrieve(
              String(fee?.balance_transaction),
            ));
          const exchangeRate = balanceTransaction.exchange_rate;
          convertedAmount = Math.round(fee.amount * exchangeRate);
        } else {
          convertedAmount = Number(fee?.amount);
        }
        return {
          amount: convertedAmount,
          amount_origin: Number(fee?.amount),
          currency: fee?.currency,
          transactionId: fee?.balance_transaction,
          chargeId: fee?.charge,
          status: (fee?.refunded === false && fee?.livemode === true) ? 'succeeded' : 'fail',
          created_at_unix: fee?.created,
          date: moment.tz(moment.unix(fee?.created).tz(Timezone).format('YYYY-MM-DD'), Timezone).toDate(),
          userId: userId[0]?.userId ?? fee?.account,
          feeId: fee?.id,
        };
      });

      const feesArray = await Promise.all(feesArrayPromises);
      await this._dbService.superAdminFees.createMany({
        data: feesArray,
      });

      return 0;
    } catch (error: any) {
      if (error.statusCode === 429) {
        console.log('Reached rate limit. Try again later.');
      } else {
        console.log(error);
      }
    }
  }

  //saving admin charges
  // @Cron('*/10 * * * * *')
  @Cron('00 02 * * *', { timeZone: Timezone })
  async saveAdminCharges(): Promise<any> {
    try {
      const accounts: any = await this._dbService.stripeConnect.findMany({});

      for (let i = 0; i < accounts?.length; i++) {
        try {
          const adminUserId: any = accounts[i]?.userId;
          const accountId: any = accounts[i]?.stripeAccountId;

          const latestChargeByAdmin: any = await this._dbService.adminCharges.findFirst(
            {
              where: { userId: adminUserId },
              orderBy: { created_at_unix: 'desc' },
            },
          );

          const options: any = {
            limit: 100,
            ...(latestChargeByAdmin?.created_at_unix ? { created: { gte: Number(latestChargeByAdmin.created_at_unix) + 1, } } : {}),
          };

          const allCharges = [];
          const charges = await this.stripeClient.charges.list(options, {
            stripeAccount: accountId,
          });

          allCharges.push(...charges.data);
          let hasMore = charges.has_more;
          let lastItem = null;

          if (charges?.data?.length > 0) {
            lastItem = charges.data[charges.data?.length - 1]?.id;
          }

          let times = 0;
          while (hasMore) {
            const moreCharges = await this.stripeClient.charges.list({
              limit: 100,
              ...(latestChargeByAdmin?.created_at_unix ? { created: { gte: Number(latestChargeByAdmin.created_at_unix) + 1, } } : {}),
              starting_after: lastItem,
            },
              { stripeAccount: accountId },
            );

            allCharges.push(...moreCharges.data);
            hasMore = moreCharges.has_more;
            lastItem = moreCharges.data.slice(-1)[0]?.id;
            times++;
            console.log("Times logs", times)
          }

          const chargesArrayPromises = allCharges?.reverse()
            .map(async (charge: any) => {
              try {
                let convertedAmount: any = 0;
                let convertedFee: any = 0;
                if (charge.currency != 'usd' && charge?.balance_transaction != null) {
                  const balanceTransaction =
                    await this.stripeClient.balanceTransactions.retrieve(
                      String(charge?.balance_transaction),
                    );
                  const exchangeRate = balanceTransaction.exchange_rate;
                  convertedAmount = Math.round(charge.amount * exchangeRate);
                  convertedFee = Math.round(charge.application_fee_amount * exchangeRate);
                } else {
                  convertedAmount = Number(charge?.amount);
                  convertedFee = Number(charge?.application_fee_amount);
                }
                return {
                  userId: adminUserId,
                  amount: convertedAmount,
                  amount_origin: Number(charge?.amount),
                  fee: convertedFee,
                  fee_origin: Number(charge?.application_fee_amount),
                  currency: charge?.currency,
                  status: charge?.status,
                  transactionId: charge?.balance_transaction,
                  created_at_unix: charge?.created,
                  chargeId: charge?.id,
                  applicationId: charge?.application,
                  invoice: charge?.invoice,
                  customerEmail: charge?.billing_details?.email,
                  customerId: charge?.customer,
                  date: moment.tz(moment.unix(charge?.created).tz(Timezone).format('YYYY-MM-DD'), Timezone).toDate(),
                  disputed: (charge?.dispute === null) ? false : true,
                };

              } catch (error: any) {
                console.log("balance transaction error:", error);
              }
            });

          const chargesArray = await Promise.all(chargesArrayPromises);
          await this._dbService.adminCharges.createMany({
            data: chargesArray,
          });
        } catch (error: any) {
          if (error.type === 'StripeInvalidRequestError' || error.type === 'StripePermissionError') {
            console.error(`Error processing account ${error.message}`);
          } else {
            // Re-throw the error if it's not a StripeInvalidRequestError
            console.error(`Error processing account ${error.message}`);
          }
        }
      }
      return 'success!'
    } catch (error: any) {
      if (error.statusCode === 429) {
        console.log('Reached rate limit. Try again later.');
      } else {
        console.log(error);
      }
    }
  }

  //saving admin customers
  @Cron('00 23 * * *', { timeZone: Timezone })
  async saveAdminCustomers(): Promise<any> {
    try {
      const accounts: any = await this._dbService.stripeConnect.findMany({});

      for (let i = 0; i < accounts?.length; i++) {
        try {
          const adminUserId: any = accounts[i]?.userId;
          const accountId: any = accounts[i]?.stripeAccountId;

          const latestCustomerByAdmin: any = await this._dbService.adminCustomers.findFirst(
            {
              where: { userId: adminUserId },
              orderBy: { created_at_unix: 'desc' },
            },
          );

          const options: any = {
            limit: 100,
            ...(latestCustomerByAdmin?.created_at_unix ? { created: { gte: Number(latestCustomerByAdmin.created_at_unix) + 1, } } : {})
          };

          const allCustomers = [];
          const customers = await this.stripeClient.customers.list(options, {
            stripeAccount: accountId,
          });

          allCustomers.push(...customers.data);
          let hasMore = customers?.has_more;
          let lastItem = null;

          if (customers?.data?.length > 0) {
            lastItem = customers.data[customers.data?.length - 1]?.id;
          }

          let times = 0;
          while (hasMore) {
            const moreCustomers = await this.stripeClient.customers.list({
              limit: 100,
              ...(latestCustomerByAdmin?.created_at_unix ? { created: { gte: Number(latestCustomerByAdmin.created_at_unix) + 1, } } : {}),
              starting_after: lastItem,
            },
              { stripeAccount: accountId },
            );

            allCustomers.push(...moreCustomers.data);
            hasMore = moreCustomers.has_more;
            lastItem = moreCustomers.data.slice(-1)[0]?.id;
            times++;
            console.log("Times logs", times)
          }

          const customersArrayPromises = allCustomers?.reverse()
            .map(async (customer: any) => {
              return {
                userId: adminUserId,
                customerId: customer?.id,
                created_at_unix: customer?.created,
                email: customer?.email,
                name: customer?.name,
                date: moment.tz(moment.unix(customer?.created).tz(Timezone).format('YYYY-MM-DD'), Timezone).toDate(),
              };
            });

          const customersArray = await Promise.all(customersArrayPromises);
          await this._dbService.adminCustomers.createMany({
            data: customersArray,
          });
        } catch (error: any) {
          if (error.type === 'StripeInvalidRequestError' || error.type === 'StripePermissionError') {
            console.error(`Error processing account ${error.message}`);
          } else {
            // Re-throw the error if it's not a StripeInvalidRequestError
            throw error;
          }
        }
      }
      return 'success!'
    } catch (error: any) {
      if (error.statusCode === 429) {
        console.log('Reached rate limit. Try again later.');
      } else {
        console.log(error);
      }
    }
  }

  //saving admin subscriptions
  @Cron('00 00-23/4 03 * * *', { timeZone: Timezone })
  async saveAdminSubscriptions(): Promise<any> {
    try {
      const accounts: any = await this._dbService.stripeConnect.findMany({});

      console.log("accunt length ==>", accounts.length)

      for (let i = 0; i < accounts?.length; i++) {
        try {
          const adminUserId: any = accounts[i]?.userId;
          const accountId: any = accounts[i]?.stripeAccountId;

          const latestSubscriptionByAdmin: any = await this._dbService.adminSubscriptions.findFirst(
            {
              where: { userId: adminUserId },
              orderBy: { created_at_unix: 'desc' },
            },
          );

          const options: any = {
            limit: 100,
            status: 'all',
            expand: ["data.plan.product"],
            ...(latestSubscriptionByAdmin?.created_at_unix ? { created: { gte: Number(latestSubscriptionByAdmin.created_at_unix) + 1, } } : {})
          };

          const allSubscriptions = [];
          const subscriptions = await this.stripeClient.subscriptions.list(options, {
            stripeAccount: accountId,
          });

          allSubscriptions.push(...subscriptions.data);
          let hasMore = subscriptions?.has_more;
          let lastItem = null;

          if (subscriptions?.data?.length > 0) {
            lastItem = subscriptions.data[subscriptions.data?.length - 1]?.id;
          }

          let times = 0;
          while (hasMore) {
            const moreSubscriptions = await this.stripeClient.subscriptions.list({
              limit: 100,
              status: 'all',
              expand: ["data.plan.product"],
              ...(latestSubscriptionByAdmin?.created_at_unix ? { created: { gte: Number(latestSubscriptionByAdmin.created_at_unix) + 1, } } : {}),
              starting_after: lastItem,
            },
              { stripeAccount: accountId },
            );

            allSubscriptions.push(...moreSubscriptions.data);
            hasMore = moreSubscriptions.has_more;
            lastItem = moreSubscriptions.data.slice(-1)[0]?.id;
            times++;
            console.log("Times logs", times)
          }

          const subscriptionsArrayPromises = allSubscriptions?.reverse()
            .map(async (subscription: any) => {
              return {
                userId: adminUserId,
                subscriptionId: subscription?.id,
                status: subscription?.status,
                created_at_unix: subscription?.created,
                canceled_at_unix: subscription?.canceled_at,
                amount: Number(subscription?.plan?.amount),
                amount_origin: Number(subscription?.plan?.amount),
                currency: subscription?.plan?.currency,
                customerId: subscription?.customer,
                applicationId: subscription?.application,
                itemId: subscription?.items?.data[0]?.id,
                planId: subscription?.plan?.id,
                priceId: subscription?.items?.data[0]?.price?.id,
                productId: subscription?.plan?.product?.id,
                latestInvoiceId: subscription?.latest_invoice,
                currentPeriodEnd: subscription?.current_period_end,
                currentPeriodStart: subscription?.current_period_start,
                billingCycleAnchor: subscription?.billing_cycle_anchor,
                date: moment.tz(moment.unix(subscription?.created).tz(Timezone).format('YYYY-MM-DD'), Timezone).toDate(),
                interval: subscription?.plan?.interval,
                productName: subscription?.plan?.product?.name,
              };
            });

          const subscriptionsArray = await Promise.all(subscriptionsArrayPromises);
          await this._dbService.adminSubscriptions.createMany({
            data: subscriptionsArray,
          });
        } catch (error: any) {
          if (error.type === 'StripeInvalidRequestError' || error.type === 'StripePermissionError') {
            console.error(`Error processing account ${error.message}`);
          } else {
            // Re-throw the error if it's not a StripeInvalidRequestError
            throw error;
          }
        }
      }
      console.log("admin subscriptions saved successfully");
      return "admin subscriptions saved successfully";
    } catch (error: any) {
      if (error.statusCode === 429) {
        console.log('Reached rate limit. Try again later.');
      } else {
        console.log(error);
      }
    }
  }

  async getConnectedAccounts(): Promise<any> {
    const accounts: any = await this.stripeClient.accounts.list({ limit: 100 });

    let realStripeAccountIds = [];
    let realStripeAccounts = [];
    accounts.data.map((account: any) => {
      if (account.payouts_enabled === true && account.charges_enabled === true)
        realStripeAccountIds.push(account.id);
      realStripeAccounts.push({ email: account.email, accountId: account.id });
    })

    const accountIds = await prisma.stripeConnect.findMany({
      select: {
        stripeAccountId: true,
      }
    }).then(data => data.map(record => record.stripeAccountId));

    const existingUserIds = await prisma.stripeConnect.findMany({
      select: {
        userId: true,
      }
    }).then(data => data.map(record => record.userId));


    // const difference = accountIds.filter(x => !realStripeAccountIds.includes(x));
    // const missingAccountsInDB = realStripeAccountIds.filter(x => !accountIds.includes(x));
    // const result = await prisma.stripeConnect.updateMany({
    //   where: {
    //     stripeAccountId: { in: difference },
    //     deleted_at: null,
    //   },
    //   data: {
    //     deleted_at: new Date()
    //   }
    // });

    const missingAccountsPromise = accounts.data.filter(
      account => account.payouts_enabled === true && account.charges_enabled === true && !accountIds.includes(account.id)
    ).map(async (account) => {

      const user = await this.withRetry(() => prisma.user.findFirst({
        where: {
          email: account?.email,
          deleted_at: null,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
        }
      }));

      return {
        email: account?.email,
        accountId: account?.id,
        userId: user?.id
      }
    })
    const realMissingAccounts = await Promise.all(missingAccountsPromise);

    const seedData = realMissingAccounts.filter(account => account?.userId != null && !existingUserIds.includes(account?.userId)).map((account: any) => {
      return {
        userId: account.userId,
        stripeAccountId: account.accountId,
        stripeConnectUrl: 'https://stripe.com',
        connectStatus: true,
      }
    });

    const dbupdate = await this._dbService.stripeConnect.createMany({
      data: seedData,
    });

    return { dbupdate: dbupdate }
  }

  @OnEvent('appowner.subscription.created')
  async handleAppOwnerCreated() {
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
}
