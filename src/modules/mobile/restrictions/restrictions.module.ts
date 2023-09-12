import { forwardRef, Module } from "@nestjs/common";
import { RestrictionsController } from "./restrictions.controller";
import { RestrictionsService } from "./restrictions.service";
import { FirebaseModule } from "../../firestore/firebase.module";
import { PricingPlanModule } from "../../app/pricing-plan/pricing-plan.module";

@Module({
  imports: [FirebaseModule, forwardRef(() => PricingPlanModule)],
  controllers: [RestrictionsController],
  providers: [RestrictionsService],
  exports: [RestrictionsService]
})
export class RestrictionsModule {
}
