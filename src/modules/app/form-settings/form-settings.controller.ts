import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { FormSettingsService } from './form-settings.service';
import { CreateFormStylesDto } from './dto/create-form-styles.dto';
import { AppsService } from '../apps/apps.service';

@Controller('f')
export class FormSettingsController {
  constructor(
    private formSettingsService: FormSettingsService,
    private appService: AppsService,
  ) {}

  @Get('get/:id')
  async getForm(@Param('id') id: string) {
    return await this.formSettingsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('styles')
  async getStyle(@CurrentUser() user) {
    const app = await this.appService.getAppByUserId(user.id);
    return await this.formSettingsService.findStyle(app.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('app')
  async getApp(@CurrentUser() user) {
    return await this.formSettingsService.findApp(user.id);
  }

  @Get('z/:id')
  async getFreeForm(@Param('id') id: string) {
    return await this.formSettingsService.findFree(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create/styles')
  async saveStyles(@CurrentUser() user, @Body() data: CreateFormStylesDto) {
    const app = await this.appService.getAppByUserId(user.id);
    return await this.formSettingsService.createStyle(data, {
      user: user.id,
      app: app.id,
    });
  }
}
