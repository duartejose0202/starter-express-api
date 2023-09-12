import {
  Body,
  Controller, Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { ExerciseDocument } from './exercise.document';
import { ExerciseAssignmentDocument } from "./exercise_assignment.document";
import { ChunkArray } from "../../../helpers/array.helper";
import { CurrentUser } from "../../../core/decorators/currentUser.decorator";
import { AuthUserDto } from "../auth/auth-user.dto";
import { ExerciseEntryDocument } from "./exercise-entry.document";

@Controller('/mobile/v1/apps/:appId/exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getExercises(
    @Param('appId') appId: string,
    @Query('ids') ids?: string[],
  ) {
    if (ids != null && ids.length > 0) {
      if (!Array.isArray(ids)) ids = [ids];
      ids = ids.filter((id) => id != null && id.length > 0);
      const chunks = ChunkArray(ids, 10);
      const promises = chunks.map(async (chunk) => {
        return await this.exerciseService.getExercisesByIds(appId, chunk);
      });
      const results = await Promise.all(promises);
      return results.flat();
    } else {
      return await this.exerciseService.getExercises(appId);
    }
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/assignment/refresh')
  async refreshExerciseAssignment(
    @Param('appId') appId: string,
    @Query('path') path: string,
  ) {
    return await this.exerciseService.refreshExerciseAssignment(appId, path);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/assignment/save')
  async updateExerciseAssignment(
    @Param('appId') appId: string,
    @Body() assignment: ExerciseAssignmentDocument,
  ) {
    return await this.exerciseService.updateExerciseAssignment(appId, assignment);
  }

  @Post('/')
  async createExercise(
    @Param('appId') appId: string,
    @Body() exercise: ExerciseDocument,
  ) {
    return await this.exerciseService.createExercise(appId, exercise);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/:exerciseId')
  async updateExercise(
    @Param('appId') appId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() exercise: ExerciseDocument,
  ) {
    return await this.exerciseService.updateExercise(
      appId,
      exerciseId,
      exercise,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/:exerciseId')
  async deleteExercise(
    @Param('appId') appId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return await this.exerciseService.deleteExercise(
      appId,
      exerciseId,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/:exerciseId/entries')
  async createExerciseEntry(
    @Param('appId') appId: string,
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() entry: ExerciseEntryDocument,
    ) {
    return await this.exerciseService.createExerciseEntry(appId, user.id, exerciseId, entry);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:exerciseId/entries')
  async getExerciseEntries(
    @Param('appId') appId: string,
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.exerciseService.getExerciseEntries(appId, user.id, exerciseId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:exerciseId/oneRepMax')
  async getExerciseOneRepMax(
    @Param('appId') appId: string,
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    const oneRepMax = await this.exerciseService.getExerciseOneRepMax(appId, user.id, exerciseId);
    return { oneRepMax };
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/:exerciseId/oneRepMax')
  async saveOneRepMax(
    @Param('appId') appId: string,
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() body: any,
  ) {
    return await this.exerciseService.saveOneRepMax(appId, user.id, exerciseId, body.oneRepMax);
  }

}
