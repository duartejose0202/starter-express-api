import { Module } from '@nestjs/common';
import DatabaseModule from 'src/database/database.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
