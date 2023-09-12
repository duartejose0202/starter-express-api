import { forwardRef, Module } from '@nestjs/common';
import { PricingPlanService } from './pricing-plan.service';
import { PricingPlanController } from './pricing-plan.controller';
import DatabaseModule from '../../../database/database.module';
import { StripeModule } from '../stripe/stripe.module';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { FormSettingsModule } from '../form-settings/form-settings.module';
import { FormSettingsController } from '../form-settings/form-settings.controller';
import { AppsModule } from '../apps/apps.module';
import { ProgramsModule } from 'src/modules/mobile/programs/programs.module';
import { HomeElementsModule } from 'src/modules/mobile/home_elements/home-elements.module';
import { RestrictionsService } from "../../mobile/restrictions/restrictions.service";
import { RestrictionsModule } from "../../mobile/restrictions/restrictions.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    StripeModule,
    StripeConnectModule,
    UsersModule,
    RolesModule,
    DatabaseModule,
    FormSettingsModule,
    AppsModule,
    ProgramsModule,
    HomeElementsModule,
    forwardRef(() => RestrictionsModule),
    AuthModule
  ],
  controllers: [PricingPlanController, FormSettingsController],
  providers: [PricingPlanService],
  exports: [PricingPlanService],
})
export class PricingPlanModule { }
