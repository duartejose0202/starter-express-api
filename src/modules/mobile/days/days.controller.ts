import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DaysService } from './days.service';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';

@Controller('mobile/v1/apps/:appId/days')
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/exercise')
  async getExerciseDays(@Param('appId') appId: string) {
    return await this.daysService.getExerciseDays(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/exercise/:dayId/assignments')
  async getExerciseDayAssignments(
    @Param('appId') appId: string,
    @Param('dayId') dayId: string,
  ) {
    return await this.daysService.getExerciseAssignmentsForDay(appId, dayId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/nutrition')
  async getMealDays(@Param('appId') appId: string) {
    return await this.daysService.getMealDays(appId);
  }
}
