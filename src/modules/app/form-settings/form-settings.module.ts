import { Module } from '@nestjs/common';
import { FormSettingsController } from './form-settings.controller';
import { FormSettingsService } from './form-settings.service';
import { StripeConnectController } from '../stripe-connect/stripe-connect.controller';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import DatabaseService from 'src/database/database.service';
import DatabaseModule from 'src/database/database.module';
import { UsersService } from '../users/users.service';
import { AppDataModule } from "../../mobile/app_data/app-data.module";
import { AppsModule } from '../apps/apps.module';
import { AppsService } from '../apps/apps.service';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    StripeConnectModule,
    DatabaseModule,
    AppDataModule,
    AppsModule,
    AuthModule
  ],
  controllers: [FormSettingsController, StripeConnectController],
  providers: [
    FormSettingsService,
    StripeConnectService,
    DatabaseService,
    UsersService,
    AppsService,
  ],
  exports: [FormSettingsService],
})
export class FormSettingsModule {
}
