import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { FirebaseModule } from '../../firestore/firebase.module';
import { PushNotificationModule } from '../push-notifications/push-notification.module';
import { AppsModule } from 'src/modules/app/apps/apps.module';
import { UsersModule } from 'src/modules/app/users/users.module';
import { ChatGateway } from './messages.gateway';

@Module({
  imports: [FirebaseModule, PushNotificationModule, AppsModule, UsersModule],
  controllers: [MessagesController],
  providers: [MessagesService, ChatGateway],
  exports: [ChatGateway],
})
export class MessagesModule {}
