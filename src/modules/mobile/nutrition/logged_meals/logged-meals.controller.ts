import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LoggedMealsService } from './logged-meals.service';
import { FirebaseAuthGuard } from '../../../../core/guards/firebase-auth.guard';
import { CurrentUser } from '../../../../core/decorators/currentUser.decorator';
import { AuthUserDto } from '../../auth/auth-user.dto';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { LoggedMealDocument } from './logged-meal.document';
import { MealItemDocument } from './meal-item.document';
import { ReorderDto } from "../../shared/dtos/reorder.dto";
import { plainToInstance } from "class-transformer";

@Controller('/mobile/v1/apps/:appId/user/loggedMeals')
export class LoggedMealsController {
  constructor(private readonly loggedMealsService: LoggedMealsService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getLoggedMeals(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Query('date') date: string,
  ) {
    const timestamp = Timestamp.fromDate(new Date(date));
    return await this.loggedMealsService.getLoggedMeals(
      appId,
      user.id,
      timestamp,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/mealItems')
  async getMealItems(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Query('ids') ids: string[],
  ) {
    return await this.loggedMealsService.getMealItems(appId, user.id, ids);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/')
  async logMeal(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() meal: LoggedMealDocument,
  ) {
    meal = plainToInstance(LoggedMealDocument, meal);
    await this.loggedMealsService.logMeal(appId, user.id, meal);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/mealItems')
  async logMealItem(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() mealItem: MealItemDocument,
  ) {
    mealItem = plainToInstance(MealItemDocument, mealItem);
    return await this.loggedMealsService.logMealItem(appId, user.id, mealItem);
  }
}
