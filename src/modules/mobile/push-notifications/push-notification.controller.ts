import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";
import { PushNotification } from "./push-notification.model";

@Controller('/mobile/v1/apps/:appId/pushNotification')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/')
  async getPushNotification(
    @Param('appId') appId: string,
    @Body() pushNotification: PushNotification
  ) {
    return await this.pushNotificationService.sendPushNotification(appId, '/topics/' + appId, pushNotification);
  }
}
