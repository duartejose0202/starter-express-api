import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import DatabaseModule from '../../../database/database.module';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { StripeConnectController } from '../stripe-connect/stripe-connect.controller';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { RolesModule } from '../roles/roles.module';
import { MobileUsersModule } from 'src/modules/mobile/users/mobile-users.module';
import { UsersModule } from '../users/users.module';
import { StripeModule } from '@golevelup/nestjs-stripe';
import { AuthModule } from "../auth/auth.module";
@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    MobileUsersModule,
    RolesModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    StripeModule.forRoot(StripeModule, {
      apiKey: process.env.STRIPE_SECRET_KEY,
      webhookConfig: {
        stripeSecrets: {
          account: process.env.STRIPE_INVOICE_WEBHOOK_SECRET_ACCOUNT,
        },
      },
    }),
  ],
  providers: [SubscriptionService, StripeConnectService],
  controllers: [SubscriptionController, StripeConnectController],
})
export class SubscriptionModule {}
