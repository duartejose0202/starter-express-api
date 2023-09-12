import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { FirebaseModule } from '../../firestore/firebase.module';
import { MobileUsersModule } from "../users/mobile-users.module";

@Module({
  imports: [FirebaseModule, MobileUsersModule],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
