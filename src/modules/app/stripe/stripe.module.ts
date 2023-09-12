import { forwardRef, Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, UsersModule, StripeConnectModule, forwardRef(() => AuthModule)],
  providers: [StripeService, UsersService, StripeConnectService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {
}
