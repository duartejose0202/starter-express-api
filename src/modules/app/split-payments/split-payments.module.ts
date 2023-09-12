import { Module } from '@nestjs/common';
import { SplitPaymentsController } from './split-payments.controller';
import { SplitPaymentsService } from './split-payments.service';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { StripeModule } from '../stripe/stripe.module';
import DatabaseService from 'src/database/database.service';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [StripeConnectModule, StripeModule, AuthModule],
  controllers: [SplitPaymentsController],
  providers: [SplitPaymentsService, DatabaseService],
  exports: [],
})
export class SplitPaymentsModule {}
