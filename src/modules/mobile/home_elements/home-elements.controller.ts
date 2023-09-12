import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post, Put,
  UseGuards,
} from '@nestjs/common';
import { HomeElementsService } from './home-elements.service';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { HomeElementsDto } from './home-elements.dto';
import { HomeElementDocument } from "./home-element.document";

@Controller('/mobile/v1/apps/:appId/homeElements')
export class HomeElementsController {
  constructor(private readonly homeElementsService: HomeElementsService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getHomeElements(@Param('appId') appId: string) {
    return await this.homeElementsService.getHomeElements(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/')
  async saveHomeElements(
    @Param('appId') appId: string,
    @Body() dto: HomeElementsDto,
  ) {
    return await this.homeElementsService.saveHomeElements(
      appId,
      dto.homeElements,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/:elementId')
  async updateHomeElement(
    @Param('appId') appId: string,
    @Param('elementId') elementId: string,
    @Body() element: HomeElementDocument,
  ) {
    return await this.homeElementsService.updateHomeElement(
      appId,
      element,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/:homeElementId')
  async deleteHomeElement(
    @Param('appId') appId: string,
    @Param('homeElementId') homeElementId: string,
  ) {
    return await this.homeElementsService.deleteHomeElement(
      appId,
      homeElementId,
    );
  }
}
