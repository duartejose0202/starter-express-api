import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import { RolesModule } from '../roles/roles.module';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { StripeModule } from '../stripe/stripe.module';
import { UsersModule } from '../users/users.module';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    StripeModule,
    StripeConnectModule,
    UsersModule,
    RolesModule,
    DatabaseModule,
    AuthModule
  ],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule {}
