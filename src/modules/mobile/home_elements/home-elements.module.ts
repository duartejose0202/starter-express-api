import { Module } from '@nestjs/common';
import { HomeElementsController } from './home-elements.controller';
import { HomeElementsService } from './home-elements.service';
import { FirebaseModule } from '../../firestore/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [HomeElementsController],
  providers: [HomeElementsService],
  exports: [HomeElementsService],
})
export class HomeElementsModule {}
