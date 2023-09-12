import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PromoDto } from './dto/promo.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post('save')
  async saveData(@Body() data: CreateSubscriptionDto) {
    return this.subscriptionService.subscribe(data);
  }

  @Post('free/save')
  async saveFreeData(@Body() data: any) {
    return await this.subscriptionService.signup(data);
  }

  @Post('get-promo')
  async getPromo(@Body() data: PromoDto) {
    return await this.subscriptionService.getPromo(
      data.promotion_code,
      data.seller_id,
    );
  }

  @Post('update-payment-intent')
  async updatePaymentIntent(@Body() data: any) {
    return await this.subscriptionService.updatePaymentIntent(data);
  }

  @Post('complete-purchase')
  async completePurchase(@Body() data: any) {
    return await this.subscriptionService.finalizePurchase(data);
  }

  @Post('3d-finalize')
  async threeDFinalize(@Body() data: any) {
    return await this.subscriptionService.scaFinalize(data);
  }

  @Post('db')
  async dbSubscription(@Body() data: any) {
    return await this.subscriptionService.subscribeDb(data);
  }

  @Post('test')
  async testBilling(@Body() data: any) {
    return await this.subscriptionService.testSubscriptionBilling(
      data.subscription_id,
    );
  }
}
