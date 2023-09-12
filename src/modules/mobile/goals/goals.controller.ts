import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { GoalsService } from './goals.service';
import { GoalDocument } from "./goal.document";
import { ChartDataDocument, ChartItemDocument } from "./chart-data.document";
import { ReorderDto } from "../shared/dtos/reorder.dto";
import { GoalEntryDocument } from "./goal-entry.document";

@Controller('/mobile/v1/apps/:appId/user/goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/entries')
  async getGoalEntries(@Param('appId') appId: string, @CurrentUser() user) {
    return await this.goalsService.getGoalEntries(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getGoals(@Param('appId') appId: string, @CurrentUser() user) {
    return await this.goalsService.getGoals(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:goalId')
  async updateGoal(
    @Param('appId') appId: string,
    @Param('goalId') goalId: string,
    @Body() goal: GoalDocument,
    @CurrentUser() user,
  ) {
    return await this.goalsService.updateGoal(appId, user.id, goal);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/global/:goalId')
  async updateGlobalGoal(
    @Param('appId') appId: string,
    @Param('goalId') goalId: string,
    @Body() goal: GoalDocument,
    @CurrentUser() user,
  ) {
    return await this.goalsService.updateGlobalGoal(appId, user.id, goal);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/')
  async addGoal(
    @Param('appId') appId: string,
    @Body() goal: GoalDocument,
    @CurrentUser() user,
  ) {
    return await this.goalsService.addGoal(appId, user.id, goal);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/global/:goalId')
  async deleteGlobalGoal(
    @Param('appId') appId: string,
    @Param('goalId') goalId: string,
  ) {
    return await this.goalsService.deleteGlobalGoal(appId, goalId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/:goalId')
  async deleteGoal(
    @Param('appId') appId: string,
    @Param('goalId') goalId: string,
    @CurrentUser() user,
  ) {
    return await this.goalsService.deleteGoal(appId, user.id, goalId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/charts')
  async getCharts(
    @Param('appId') appId: string,
    @CurrentUser() user,
  ) {
    return await this.goalsService.getCharts(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/charts')
  async addChart(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Body() chart: ChartDataDocument
  ) {
    return await this.goalsService.addChart(appId, user.id, chart);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/charts/:chartId')
  async updateChart(
    @Param('appId') appId: string,
    @Param('chartId') chartId: string,
    @CurrentUser() user,
    @Body() chart: ChartDataDocument
  ) {
    return await this.goalsService.updateChart(appId, user.id, chartId, chart);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/charts/:chartId')
  async deleteChart(
    @Param('appId') appId: string,
    @Param('chartId') chartId: string,
    @CurrentUser() user,
  ) {
    return await this.goalsService.deleteChart(appId, user.id, chartId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/charts/:chartId/items')
  async getChartItems(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Param('chartId') chartId: string,
  ) {
    return await this.goalsService.getItemsForChart(appId, user.id, chartId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/charts/:chartId/items')
  async addChartItem(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Param('chartId') chartId: string,
    @Body() item: ChartItemDocument
  ) {
    return await this.goalsService.addItemToChart(appId, user.id, chartId, item);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/charts/:chartId/items/:itemId')
  async deleteChartItem(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Param('chartId') chartId: string,
    @Param('itemId') itemId: string,
  ) {
    return await this.goalsService.deleteItemFromChart(appId, user.id, chartId, itemId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/charts/reorder')
  async reorderChartItems(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Body() reorderDto: ReorderDto
  ) {
    return await this.goalsService.reorderCharts(appId, user.id, reorderDto.ids);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/:goalId/entries')
  async addGoalEntry(
    @Param('appId') appId: string,
    @Param('goalId') goalId: string,
    @Body() entry: GoalEntryDocument,
    @CurrentUser() user,
  ) {
    return await this.goalsService.addGoalEntry(appId, user.id, goalId, entry);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:goalId/entries/:entryId')
  async updateGoalEntry(
    @Param('appId') appId: string,
    @Param('goalId') goalId: string,
    @Param('entryId') entryId: string,
    @Body() entry: GoalEntryDocument,
    @CurrentUser() user,
  ) {
    return await this.goalsService.updateGoalEntry(appId, user.id, goalId, entryId, entry);
  }
}
