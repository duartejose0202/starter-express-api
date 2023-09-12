import { Controller, Get, Param, Query } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';

@Controller('/mobile/v1/apps/:appId/ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get('/')
  async getIngredients(
    @Param('appId') appId: string,
    @Query('mealId') mealId?: string,
  ) {
    if (mealId) {
      return await this.ingredientsService.getIngredientsForMeal(appId, mealId);
    } else {
      return await this.ingredientsService.getIngredients(appId);
    }
  }
}
