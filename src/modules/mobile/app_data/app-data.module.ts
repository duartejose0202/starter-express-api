import { Module } from '@nestjs/common';
import { AppDataService } from './app-data.service';
import { AppDataController } from './app-data.controller';
import { FirebaseModule } from '../../firestore/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [AppDataController],
  providers: [AppDataService],
  exports: [AppDataService],
})
export class AppDataModule {}
