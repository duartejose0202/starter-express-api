import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/guards/jwt.guard';
import { AppPublishService } from './app-publish.service';
import { AppleAccountRequestDto } from './dto/apple.account.request.dto';
import { AppleAppDetailRequestDto } from './dto/apple.app.detail.request.dto';
import { GoogleAccountRequestDto } from './dto/google.account.request.dto';
import { GoogleAppDetailRequestDto } from './dto/google.appdetail.request.dto';
import { CurrentUser } from 'src/core/decorators/currentUser.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('app-publish')
export class AppPublishController {
  constructor(private readonly appPublishService: AppPublishService) {}

  @Post('apple/account/upsert')
  upsertAppleAccount(@Body() data: AppleAccountRequestDto, @CurrentUser() user: User) {
    return this.appPublishService.upsertAppleAccount(data, user.id);
  }

  @Get('apple/app/all')
  getAllApps(@CurrentUser() user: User) {
    if (user.role_id !== '0c9272c0-bb21-4437-8e19-87438b89f02d') {
      throw new UnauthorizedException('You are not allowed to access this resource');
    }
    return this.appPublishService.getAllApps();
  }

  @Post('apple/account/:userId/bundleId')
  createBundleId(@Param('userId') userId: string, @Body() data: any) {
    return this.appPublishService.createBundleId(userId, data);
  }

  @Post('apple/account/:userId/capabilities')
  addCapability(@Param('userId') userId: string, @Body() data: any) {
    return this.appPublishService.addCapability(userId, data);
  }

  @Get('apple/account/:userId/bundleIds')
  getBundleIds(@Param('userId') userId: string) {
    return this.appPublishService.getBundleIds(userId);
  }

  @Get('apple/account/:userId')
  findAppleAccount(@Param('userId') userId: string) {
    return this.appPublishService.findAppleAccount(userId);
  }

  @Post('apple/app/upsert')
  upsertAppleAppDetail(@Body() data: AppleAppDetailRequestDto) {
    return this.appPublishService.upsertAppleAppDetail(data);
  }

  @Get('apple/app/:userId')
  findAppleAppDetail(@Param('userId') userId: string) {
    return this.appPublishService.findAppleAppDetail(userId);
  }

  @Post('google/account/upsert')
  upsertGoogleAccount(@Body() data: GoogleAccountRequestDto) {
    return this.appPublishService.upsertGoogleAccount(data);
  }

  @Get('google/account/:userId')
  findGoogleAccount(@Param('userId') userId: string) {
    return this.appPublishService.findGoogleAccount(userId);
  }

  @Post('google/app/upsert')
  upsertGoogleAppDetail(@Body() data: GoogleAppDetailRequestDto) {
    return this.appPublishService.upsertGoogleAppDetail(data);
  }

  @Get('google/app/:userId')
  findGoogleAppDetail(@Param('userId') userId: string) {
    return this.appPublishService.findGoogleAppDetail(userId);
  }
}
