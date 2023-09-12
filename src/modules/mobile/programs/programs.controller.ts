import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { ProgramDocument } from './program.document';
import { ProgramsService } from './programs.service';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { ReorderDto } from '../shared/dtos/reorder.dto';

@Controller('mobile/v1/apps/:appId/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getPrograms(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Query('customerId') customerId?: string,
  ): Promise<ProgramDocument[]> {
    return await this.programsService.getPrograms(appId, user.id, customerId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/hasPersonal')
  async hasPersonalData(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Query('customerId') customerId?: string,
  ): Promise<any> {
    const result = await this.programsService.hasPersonalData(appId, user.id);
    return { hasPersonalContent: result };
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/all')
  async getAllPrograms(
    @Param('appId') appId: string,
  ): Promise<ProgramDocument[]> {
    return await this.programsService.getAllPrograms(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/')
  async createProgram(
    @Body() program: ProgramDocument,
    @Param('appId') appId: string,
  ): Promise<ProgramDocument> {
    return await this.programsService.createProgram(appId, program);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/:programId')
  async updateProgram(
    @Body() program: ProgramDocument,
    @Param('appId') appId: string,
    @Param('programId') programId: string,
  ): Promise<ProgramDocument> {
    return await this.programsService.updateProgram(appId, programId, program);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/:programId')
  async deleteProgram(
    @Param('appId') appId: string,
    @Param('programId') programId: string,
  ) {
    await this.programsService.deleteProgram(appId, programId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:programId')
  async getProgram(
    @Param('appId') appId: string,
    @Param('programId') programId: string,
  ): Promise<ProgramDocument> {
    const program = await this.programsService.getProgram(appId, programId);
    if (program == null) {
      throw new NotFoundException('No program found');
    } else {
      return program;
    }
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/reorder')
  async reorderPrograms(
    @Param('appId') appId: string,
    @Body() body: ReorderDto,
  ) {
    await this.programsService.reorderPrograms(appId, body.ids);
  }
}
