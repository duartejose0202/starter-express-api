import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { DaysModule } from '../days/days.module';
import { FirebaseModule } from '../../firestore/firebase.module';
import { MobileUsersModule } from "../users/mobile-users.module";

@Module({
  imports: [FirebaseModule, DaysModule, MobileUsersModule],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
