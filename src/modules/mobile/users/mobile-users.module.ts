import { Module } from '@nestjs/common';
import { MobileUsersController } from './mobile-users.controller';
import { MobileUsersService } from './mobile-users.service';
import { FirebaseModule } from '../../firestore/firebase.module';
import { AppDataModule } from "../app_data/app-data.module";

@Module({
  imports: [FirebaseModule, AppDataModule],
  controllers: [MobileUsersController],
  providers: [MobileUsersService],
  exports: [MobileUsersService],
})
export class MobileUsersModule {}
