import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { AuthUserDto } from "../auth/auth-user.dto";
import { CurrentUser } from "../../../core/decorators/currentUser.decorator";
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";
import { PhotoDocument } from "./photo.document";

@Controller('/mobile/v1/apps/:appId/user/photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getPhotos(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.photosService.getPhotos(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/')
  async addPhoto(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() photo: PhotoDocument,
  ) {
    return await this.photosService.addPhoto(appId, user.id, photo);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:photoId')
  async updatePhoto(
    @Param('appId') appId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() photo: PhotoDocument,
  ) {
    return await this.photosService.updatePhoto(appId, photoId, user.id, photo);
  }
}
