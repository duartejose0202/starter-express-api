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
import { User } from '@prisma/client';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CouponService } from './coupon.service';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@UseGuards(JwtAuthGuard)
@Controller('coupon')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private stripeConnectService: StripeConnectService,
  ) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() data: CreateCouponDto) {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return this.couponService.create(res.stripeAccountId, data);
  }

  @Get('all')
  async findAll(@CurrentUser() user: User) {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return this.couponService.findAll(res.stripeAccountId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.couponService.findOne(user.id, id);
  }

  @Patch()
  update(@CurrentUser() user: User, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(user.id, updateCouponDto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return this.couponService.remove(res.stripeAccountId, id);
  }
}
