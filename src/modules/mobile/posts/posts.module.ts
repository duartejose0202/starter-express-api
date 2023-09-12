import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { FirebaseModule } from '../../firestore/firebase.module';
import { PushNotificationModule } from "../push-notifications/push-notification.module";

@Module({
  imports: [FirebaseModule, PushNotificationModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
