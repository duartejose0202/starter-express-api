import { Module } from "@nestjs/common";
import { PushNotificationController } from "./push-notification.controller";
import { PushNotificationService } from "./push-notification.service";
import { FirebaseModule } from "../../firestore/firebase.module";
import { AppsModule } from "../../app/apps/apps.module";
import { MobileUsersModule } from "../users/mobile-users.module";

@Module({
  imports: [FirebaseModule, AppsModule, MobileUsersModule],
  controllers: [PushNotificationController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushNotificationModule {
}
