import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { SectionsService } from './sections.service';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';

@Controller('/mobile/v1/apps/:appId/programs/:programId/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/:sectionId/copy')
  async copySection(
    @Param('appId') appId: string,
    @Param('programId') programId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.sectionsService.copySection(appId, programId, sectionId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getSections(
    @Param('appId') appId: string,
    @Param('programId') programId: string,
    @CurrentUser() user,
  ) {
    return await this.sectionsService.getSections(user.id, appId, programId);
  }
}
