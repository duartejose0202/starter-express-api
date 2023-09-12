import { Module } from '@nestjs/common';
import { LoggedMealsController } from './logged-meals.controller';
import { LoggedMealsService } from './logged-meals.service';
import { FirebaseModule } from '../../../firestore/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [LoggedMealsController],
  providers: [LoggedMealsService],
})
export class LoggedMealsModule {}
