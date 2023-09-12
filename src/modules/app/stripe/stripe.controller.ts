import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Param,
  Body,
  InternalServerErrorException,
  UseGuards,
  Delete,
  Patch,
  Header,
} from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/currentUser.decorator';
import { JwtAuthGuard } from 'src/core/guards/jwt.guard';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { StripeService } from './stripe.service';
import { AddProductDto } from '../pricing-plan/dto/add-product-dto';
import { AddSubscriptionDTO } from '../pricing-plan/dto/add-subscription-dto';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeConnectService: StripeConnectService,
  ) { }

  @Get('product-details/:id/:userid')
  async getProductDetails(
    @Param('id') id: string,
    @Param('userid') userId: string,
  ) {
    const stripeConnect = await this.stripeConnectService.getStripeConnection(
      userId,
    );
    if (!stripeConnect) {
      throw new BadRequestException(
        'stripe.product.get_failed_no_stripe_connect',
      );
    }
    return this.stripeService.findPriceById(id, stripeConnect.stripeAccountId);
  }

  @Post('coupon-details')
  async getCoupon(@Body() body) {
    const stripeConnect = await this.stripeConnectService.getStripeConnection(
      body.userId,
    );
    if (!stripeConnect) {
      throw new BadRequestException(
        'stripe.product.get_failed_no_stripe_connect',
      );
    }
    const promo = await this.stripeService.findCouponByCode(
      body.code,
      stripeConnect.stripeAccountId,
    );
    if (!promo) {
      throw new InternalServerErrorException(
        'stripe.coupon.get_failed_not_found',
      );
    }
    return promo;
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-charges-details')
  async getChargesDetails(@CurrentUser() user) {
    const stripeConnect = await this.stripeConnectService.getStripeConnection(
      user.id,
    );
    if (!stripeConnect) {
      throw new BadRequestException(
        'stripe.product.get_failed_no_stripe_connect',
      );
    }
    return this.stripeService.getAllCharges(stripeConnect.stripeAccountId);
  }

  @Post('net-volume')
  getNetVolume(@Body() body: any) {
    return this.stripeService.getNetVolume(body?.time, body?.custom);
  }

  @Post('sales-net-volume')
  getSalesNetVolume(@Body() body: any) {
    return this.stripeService.getSalesNetVolume(
      body?.time,
      body?.custom,
      body?.account_id,
    );
  }

  @Post('dashboard-net-volume')
  getDashboardVolume(@Body() body: any) {
    return this.stripeService.getDashboardNetVolume(
      body?.time,
      body?.custom,
      body?.accountId,
      body?.userId,
    );
  }

  @Get('paid-out/:id')
  async getPaidOut(@Param('id') id: string) {
    return await this.stripeService.recentlyPaidOut(id);
  }

  @Get('available-balance/:id')
  async availableBalance(@Param('id') id: string) {
    return await this.stripeService.getBalance(id);
  }

  @Post('dashboard-active-subscriptions')
  getActiveSubscriptionsyAdmin(@Body() body: any) {
    return this.stripeService.getActiveSubscriptionsyAdmin(body?.accountId, body?.userId);
  }

  @Post('dashboard-canceled-subscriptions')
  getCanceledSubscriptionsyAdmin(@Body() body: any) {
    return this.stripeService.getCancelledSubscriptionsyAdmin(
      body?.time,
      body?.custom,
      body?.accountId,
      body?.userId,
    );
  }

  @Post('dashboard-statistics')
  getDashboardStatistics(@Body() body: any) {
    return this.stripeService.getDashboardStatistics(body?.accountId, body?.userId);
  }

  @Post('set-gross-volume')
  setGrossVolume(@Body() body: any) {
    return this.stripeService.setGrossVolume();
  }

  @Post('set-net-volume')
  setNetVolume(@Body() body: any) {
    return this.stripeService.getNetVolumeForSale(body?.time);
  }

  @Post('net-volume-today')
  getTodayNetVolume(@Body() body: any) {
    return this.stripeService.getTodayNetVolume(body?.accountId);
  }

  @Post('sales-net-volume-today')
  getTodaySalesNetVolume(@Body() body: any) {
    return this.stripeService.getTodaySalesNetVolume(
      body?.time,
      body?.account_id,
    );
  }

  @Post('net-volume-for-sale')
  getNetVolumeForSale(@Body() body: any) {
    return this.stripeService.getNetVolumeForSale(body?.time);
  }

  @Post('new-customers')
  getNewCustomer(@Body() body: any) {
    return this.stripeService.getNewCustomer(
      body?.time,
      body?.custom,
      body?.accountId,
      body?.userId
    );
  }

  @Post('new-sales-customers')
  getNewSalesCustomers(@Body() body: any) {
    return this.stripeService.getNewSalesCustomers(
      body?.time,
      body?.custom,
      body?.account_id
    );
  }

  @Post('add-product')
  addProductForCustomer(@Body() body: AddSubscriptionDTO) {
    return this.stripeService.addSubscriptionForCustomer(
      body?.accountId,
      body
    );
  }

  @Patch('edit-product')
  editProductForCustomer(@Body() body: AddProductDto) {
    return this.stripeService.editProductForCustomer(
      body,
      body?.accountId,
    );
  }

  @Get('subscriptions/:accountId/:customer_id')
  getAllSubscriptionsByCustomer(
    @Param('accountId') stripe_account_id: any,
    @Param('customer_id') customer_id: any,
  ) {
    return this.stripeService.getAllSubscriptionsByCustomer(
      stripe_account_id,
      customer_id,
    );
  }

  @Get('subscriptions-charges/:accountId/:customer_id')
  getAllSubscriptionsAndChargesByCustomer(
    @Param('accountId') stripe_account_id: any,
    @Param('customer_id') customer_id: any,
  ) {
    return this.stripeService.getAllSubscriptionsAndChargesByCustomer(
      stripe_account_id,
      customer_id,
    );
  }

  @Get('invoices/:accountId/:customer_id/:subscriptionId')
  getAllChargesForSubscriptionForCustomer(
    @Param('accountId') stripe_account_id: string,
    @Param('customer_id') customer_id: string,
    @Param('subscriptionId') subscriptionId: string
  ) {
    return this.stripeService.getAllChargesForSubscriptionForCustomer(
      stripe_account_id,
      customer_id,
      subscriptionId
    );
  }

  @Get('charges/:accountId/:customer_id')
  getAllChargesByCustomer(
    @Param('accountId') stripe_account_id: any,
    @Param('customer_id') customer_id: any,
  ) {
    return this.stripeService.getAllChargesByCustomer(
      stripe_account_id,
      customer_id,
    );
  }

  @Delete('subscriptions/:accountId/:customer_id/:productId')
  cancelSubscription(
    @Param('accountId') stripe_account_id: any,
    @Param('customer_id') customer_id: any,
    @Param('productId') productId: any,
  ) {
    return this.stripeService.cancelSubscription(
      stripe_account_id,
      customer_id,
      productId,
    );
  }

  @Patch('charges/:accountId/:customer_id/:chargeId')
  refundPayment(
    @Param('accountId') stripe_account_id: any,
    @Param('customer_id') customer_id: any,
    @Param('chargeId') chargeId: any,
  ) {
    return this.stripeService.refundPayment(
      stripe_account_id,
      customer_id,
      chargeId,
    );
  }

  @Get('get-statistics')
  getStatistics() {
    return this.stripeService.getStatistics();
  }

  @Get('save-data-super-admin-charge')
  saveSuperAdminCharges() {
    return this.stripeService.saveSuperAdminCharges();
  }

  @Get('save-data-super-admin-fee')
  saveSuperAdminFees() {
    return this.stripeService.saveSuperAdminFees();
  }

  @Get('save-data-admin-charge')
  saveAdminCharges() {
    return this.stripeService.saveAdminCharges();
  }

  @Get('save-data-admin-customer')
  saveAdminCustomers() {
    return this.stripeService.saveAdminCustomers();
  }

  @Get('save-data-admin-subscription')
  saveAdminSubscriptions() {
    return this.stripeService.saveAdminSubscriptions();
  }

  @Get('get-connected-account-id')
  getConnectedAccounts() {
    return this.stripeService.getConnectedAccounts();
  }

  @Post('subscription/create')
  async createSubscription(
    @Body()
    params: {
      name: string;
      email: string;
      code: string;
      payment_method: string;
      payment_plan: string;
      payment_period: string;
    },
  ) {
    return this.stripeService.createSubscription(
      params.name,
      params.email,
      params.code,
      params.payment_method,
      params.payment_plan,
      params.payment_period,
    );
  }

  @Post('paymentIntent/create')
  async createPaymentIntent(
    @Body()
    params: {
      name: string;
      email: string;
      code: string;
      payment_method: string;
      payment_plan: string;
      payment_period: string;
    },
  ) {
    return this.stripeService.createOneTimeSession(
      params.name,
      params.email,
      params.code,
      params.payment_method,
      params.payment_plan,
      params.payment_period,
    );
  }

  @Post('subscription/update')
  async updateSubscription(
    @Body()
    params: {
      userId: string;
      payment_plan: string;
      payment_period: string;
    },
  ) {
    return this.stripeService.updateSubscription(
      params.userId,
      params.payment_plan,
      params.payment_period,
    );
  }

  @Post('subscription/cancel')
  async cancelSubscriptionByUserId(
    @Body()
    params: {
      userId: string;
    },
  ) {
    return this.stripeService.cancelSubscriptionByUserId(params.userId);
  }

  @Post('subscription/reactivate')
  async reactivateSubscriptionByUserId(
    @Body()
    params: {
      userId: string;
      payment_plan: string;
      payment_period: string;
    },
  ) {
    return this.stripeService.reactivateSubscription(
      params.userId,
      params.payment_plan,
      params.payment_period,
    );
  }

  @Post('subscription/extend')
  async extendSubscriptionByUserId(
    @Body()
    params: {
      userId: string;
      extendType: string;
    },
  ) {
    return this.stripeService.extendSubscriptionByUserId(params.userId, params.extendType);
  }

  @Get('discount/:code')
  async discountPercentage(@Param('code') code: string) {
    return this.stripeService.getDiscountByCode(code);
  }

  @Get('plan-prices')
  async getPlanPrices() {
    return this.stripeService.getPlanPrices();
  }

  @Get('payment-method/get/:userId')
  getPaymentMethodByUserId(@Param('userId') userId: string) {
    return this.stripeService.getPaymentMethodByUserId(userId);
  }

  @Post('payment-method/update')
  async updatePaymentMethodByUserId(
    @Body()
    params: {
      userId: string;
      payment_method: string;
    },
  ) {
    return this.stripeService.updatePaymentMethodByUserId(
      params.userId,
      params.payment_method,
    );
  }

  @Get('billing-info/get/:userId')
  getBillingInfoByUserId(@Param('userId') userId: string) {
    return this.stripeService.getBillingInfoByUserId(userId);
  }

  @Post('billing-info/update')
  async updateBillingInfoByUserId(
    @Body()
    params: {
      userId: string;
      name: string;
      line1: string;
      line2: string;
      city: string;
      country: string;
      postal: string;
    },
  ) {
    return this.stripeService.updateBillingInfoByUserId(
      params.userId,
      params.name,
      params.line1,
      params.line2,
      params.city,
      params.country,
      params.postal,
    );
  }
}
