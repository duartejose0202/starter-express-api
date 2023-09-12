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
import Stripe from 'stripe';
import { PricingPlanService } from './pricing-plan.service';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { CreatePricingPlanDto } from './dto/create-pricing-plan.dto';
import { UpdatePricingPlanDto } from './dto/update-pricing-plan.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { User } from '@prisma/client';

interface NewProduct extends Stripe.Product {
  identifier?: string;
}
@UseGuards(JwtAuthGuard)
@Controller('product')
export class PricingPlanController {
  constructor(
    private readonly pricingPlanService: PricingPlanService,
    private stripeConnectService: StripeConnectService,
  ) { }
  @Post()
  async create(@CurrentUser() user: User, @Body() data: CreatePricingPlanDto) {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return this.pricingPlanService.create(res.stripeAccountId, user.id, data);
  }

  @Get('all')
  async findAll(@CurrentUser() user: User): Promise<NewProduct[]> {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return await this.pricingPlanService.findAll(user.id, res.stripeAccountId);
  }

  @Get('contents')
  async getContentList(@CurrentUser() user: User): Promise<any> {
    return await this.pricingPlanService.getContents(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.pricingPlanService.findOne(id, user.id);
  }

  @Patch()
  async update(@CurrentUser() user: User, @Body() data: UpdatePricingPlanDto) {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return this.pricingPlanService.update(res.stripeAccountId, data, user.id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return this.pricingPlanService.remove(id, res.stripeAccountId);
  }

}
