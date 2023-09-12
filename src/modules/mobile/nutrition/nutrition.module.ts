import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { IngredientsModule } from './ingredients/ingredients.module';
import { LoggedMealsModule } from './logged_meals/logged-meals.module';
import { FirebaseModule } from '../../firestore/firebase.module';

@Module({
  imports: [FirebaseModule, IngredientsModule, LoggedMealsModule],
  controllers: [NutritionController],
  providers: [NutritionService],
})
export class NutritionModule {}
