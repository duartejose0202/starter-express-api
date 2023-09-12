import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param, Post,
  Put, Query,
  UseGuards,
} from '@nestjs/common';
import { AppDataService } from './app-data.service';
import { AppDataDocument } from './app-data.document';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { StylesDocument } from './styles.document';

@Controller('mobile/v1/apps')
export class AppDataController {
  constructor(private readonly appService: AppDataService) {}

  @Get('')
  async getAllApps(): Promise<AppDataDocument[]> {
    return await this.appService.getAllApps();
  }

  @Get('/slug/:slug')
  async getAppBySlug(
    @Param('slug') slug: string,
  ): Promise<any> {
    const app = await this.appService.getAppBySlug(slug);
    if (app != null) {
      return { appId: app.id };
    } else {
      throw new NotFoundException('No app found');
    }
  }

  @Get('/:appId/slug/:slug/check')
  async checkSlug(
    @Param('appId') appId: string,
    @Param('slug') slug: string,
  ): Promise<any> {
    const response = await this.appService.checkSlug(appId, slug);
    return { available: response };
  }

  @Get('/:appId')
  async getAppData(@Param('appId') id: string): Promise<AppDataDocument> {
    const appData = await this.appService.getAppById(id);
    if (appData == null) throw new NotFoundException('No app found');
    return appData;
  }

  @Get('/admin/appId')
  async getAppIdByAdminEmail(
    @Query('email') email: string,
  ) {
    const id = await this.appService.getAppByEmail(email);
    if (id == null) {
      throw new NotFoundException('No app found');
    }

    return { appId: id };
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get(':appId/pages/:pageId')
  async getPage(
    @Param('pageId') pageId: string,
    @Param('appId') appId: string
  ) {
    return await this.appService.getPage(appId, pageId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/:appId')
  async updateApp(
    @Param('appId') id: string,
    @Body() appData: AppDataDocument,
  ): Promise<AppDataDocument> {
    try {
      return await this.appService.updateApp(appData);
    } catch (e) {
      throw new InternalServerErrorException('Failed to update app');
    }
  }

  @Get('/:appId/styles')
  async getStyles(@Param('appId') id: string): Promise<StylesDocument> {
    return await this.appService.getStyles(id);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/:appId/styles')
  async updateStyles(
    @Param('appId') id: string,
    @Body() styles: StylesDocument,
  ): Promise<StylesDocument> {
    try {
      return await this.appService.updateStyles(id, styles);
    } catch (e) {
      throw new InternalServerErrorException('Failed to update styles');
    }
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/:appId/styles/ai')
  async updateStylesAI(
    @Param('appId') appId: string,
    @Body() body: any
  ) {
    return this.appService.setStylesAI(appId, body);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:appId/checkUrl')
  async checkUrl(
    @Param('appId') appId: string,
    @Query('url') url: string
  ) {
    return this.appService.checkUrl(appId, url);
  }
}
