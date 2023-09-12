import {
  Controller, Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { AuthUserDto } from '../auth/auth-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('/mobile/v1/apps/:appId/files/')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.filesService.uploadImage(appId, file);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Get('/images')
  async getAllImages(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.filesService.getImages(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPDF(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.filesService.uploadPDF(appId, file);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.filesService.uploadVideo(appId, file);
  }
}
