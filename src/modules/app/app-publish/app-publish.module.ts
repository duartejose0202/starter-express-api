import { Module } from '@nestjs/common';
import DatabaseModule from 'src/database/database.module';
import { AppPublishController } from './app-publish.controller';
import { AppPublishService } from './app-publish.service';
import { SlackModule } from 'nestjs-slack';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SlackModule.forRoot({
      type: 'webhook',
      url: process.env.SLACK_WEBHOOK_URL,
    }),
    DatabaseModule,
    AuthModule
  ],
  controllers: [AppPublishController],
  providers: [AppPublishService],
})
export class AppPublishModule { }
