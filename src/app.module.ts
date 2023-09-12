import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/app/users/users.module';
import { StripeModule as Stripe } from 'nestjs-stripe';
import AppConfig from './configs/app.config';
import { StripeModule } from './modules/app/stripe/stripe.module';
import { PricingPlanModule } from './modules/app/pricing-plan/pricing-plan.module';
import DatabaseModule from './database/database.module';
import { CouponModule } from './modules/app/coupon/coupon.module';
import { FreeSignupModule } from './modules/app/free-signup/free-signup.module';
import { StripeConnectModule } from './modules/app/stripe-connect/stripe-connect.module';
import { AppsModule } from './modules/app/apps/apps.module';
import { AppUsersModule } from './modules/app/app-users/app-users.module';
import { FormSettingsModule } from './modules/app/form-settings/form-settings.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppPublishModule } from './modules/app/app-publish/app-publish.module';
import { MobileModule } from './modules/mobile/mobile.module';
import { FirebaseModule } from './modules/firestore/firebase.module';
import { SubscriptionModule } from './modules/app/subscription/subscription.module';
import { SplitPaymentsModule } from './modules/app/split-payments/split-payments.module';
import { NotificationModule } from './modules/app/notification/notification.module';
import { SalesModule } from './modules/app/sales/sales.module';
import { CommunityModule } from './modules/mobile/community/community.module';
import { applyRawBodyOnlyTo } from '@golevelup/nestjs-webhooks';
import { StripeModule as NestStripeModule } from '@golevelup/nestjs-stripe';
import { PhotosModule } from "./modules/mobile/photos/photos.module";
import { RecordsModule } from "./modules/mobile/records/records.module";
import { MessagesModule } from './modules/mobile/messages/messages.module';
import { SlackModule } from 'nestjs-slack';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    Stripe.forRoot({
      apiKey: AppConfig.STRIPE.SECRET_KEY,
      apiVersion: '2022-11-15',
    }),
    NestStripeModule.forRoot(NestStripeModule, {
      apiKey: process.env.STRIPE_SECRET_KEY,
      webhookConfig: {
        stripeSecrets: {
          account: process.env.STRIPE_INVOICE_WEBHOOK_SECRET_ACCOUNT,
        },
      },
    }),
    SlackModule.forRoot({
      type: 'webhook',
      url: process.env.SLACK_WEBHOOK_URL,
    }),
    AuthModule,
    UsersModule,
    StripeModule,
    StripeConnectModule,
    PricingPlanModule,
    DatabaseModule,
    CouponModule,
    FreeSignupModule,
    AppsModule,
    AppUsersModule,
    ScheduleModule.forRoot(),
    AppPublishModule,
    MobileModule,
    FirebaseModule,
    FormSettingsModule,
    SubscriptionModule,
    SplitPaymentsModule,
    EventEmitter2,
    NotificationModule,
    SalesModule,
    CommunityModule,
    PhotosModule,
    RecordsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    applyRawBodyOnlyTo(consumer, {
      method: RequestMethod.ALL,
      path: 'stripe/webhook',
    });
  }
}
