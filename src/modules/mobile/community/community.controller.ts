import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from 'src/core/decorators/currentUser.decorator';
import { FirebaseAuthGuard } from 'src/core/guards/firebase-auth.guard';
import { AuthUserDto } from '../auth/auth-user.dto';
import { CommunityService } from './community.service';
import { CommunityDocument } from './documents/community.document';
import { User } from '@prisma/client';

@Controller('/mobile/v1/apps/:appId/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getCommunities(
    @Param('appId') appId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.communityService.getCommunities(appId, user);
    return result;
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/')
  async addCommunity(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() community: CommunityDocument,
  ) {
    community = plainToInstance(CommunityDocument, community);
    return await this.communityService.addCommunity(appId, community);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/:communityId')
  async deleteCommunity(
    @Param('appId') appId: string,
    @Param('communityId') communityId: string,
  ) {
    return await this.communityService.deleteCommunity(appId, communityId);
  }

}
