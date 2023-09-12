import {
  Body,
  Controller, Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { NutritionService } from './nutrition.service';
import { MealDocument } from './meal.document';
import { IngredientAssignmentDocument } from "./ingredients/ingredient-assignment.document";

@Controller('/mobile/v1/apps/:appId/nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/meals')
  async getMeals(@Param('appId') appId: string) {
    return await this.nutritionService.getMeals(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/meals')
  async createMeal(@Param('appId') appId: string, @Body() meal: MealDocument) {
    return await this.nutritionService.createMeal(appId, meal);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/meals/:mealId')
  async updateMeal(
    @Param('appId') appId: string,
    @Param('mealId') mealId: string,
    @Body() meal: MealDocument,
  ) {
    return await this.nutritionService.updateMeal(appId, mealId, meal);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/meals/:mealId')
  async deleteMeal(
    @Param('appId') appId: string,
    @Param('mealId') mealId: string,
  ) {
    return await this.nutritionService.deleteMeal(appId, mealId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/meals/:mealId/ingredients')
  async addIngredient(
    @Param('appId') appId: string,
    @Param('mealId') mealId: string,
    @Body() ingredient: IngredientAssignmentDocument,
  ) {
    return await this.nutritionService.addIngredient(appId, mealId, ingredient);
  }
}
