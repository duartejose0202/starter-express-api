import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RestrictionsService } from './restrictions.service';
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";
import { RestrictionDocument } from "./restriction.document";

@Controller('/mobile/v1/apps/:appId/restrictions')
export class RestrictionsController {
  constructor(private readonly restrictionsService: RestrictionsService) {
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getRestrictions(
    @Param('appId') appId: string,
  ) {
    return this.restrictionsService.getRestrictionsForClient(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/')
  async createRestriction(
    @Param('appId') appId: string,
    @Body() restriction: RestrictionDocument
  ) {
    return this.restrictionsService.createRestriction(appId, restriction);
  }
}
