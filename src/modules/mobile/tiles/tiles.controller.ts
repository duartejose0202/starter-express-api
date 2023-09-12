import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TilesService } from './tiles.service';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { AuthUserDto } from '../auth/auth-user.dto';
import { TextTileDocument } from './documents/text-tile.document';
import { ImageTileDocument } from './documents/image-tile.document';
import { SearchBarTileDocument } from './documents/search-bar-tile.document';
import { VideoTileDocument } from './documents/video-tile.document';
import { CalendarTileDocument } from "./documents/calendar-tile.document";

@Controller('/mobile/v1/apps/:appId/tiles')
export class TilesController {
  constructor(private readonly tilesService: TilesService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/text')
  async getTextTiles(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.getTextTiles(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/text')
  async addTextTile(
    @Param('appId') appId: string,
    @Body() tile: TextTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.addTextTile(appId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/text/:tileId')
  async updateTextTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @Body() tile: TextTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.updateTextTile(appId, tileId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/text/:tileId')
  async deleteTextTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.deleteTextTile(appId, tileId);
  }

  // create above endpoints for each of image, searchBar, and video tiles
  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/image')
  async getImageTiles(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.getImageTiles(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/image')
  async addImageTile(
    @Param('appId') appId: string,
    @Body() tile: ImageTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.addImageTile(appId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/image/:tileId')
  async updateImageTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @Body() tile: ImageTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.updateImageTile(appId, tileId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/image/:tileId')
  async deleteImageTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.deleteImageTile(appId, tileId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/searchBar')
  async getSearchBarTiles(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.getSearchBarTiles(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/searchBar')
  async addSearchBarTile(
    @Param('appId') appId: string,
    @Body() tile: SearchBarTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.addSearchBarTile(appId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/searchBar/:tileId')
  async updateSearchBarTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @Body() tile: SearchBarTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.updateSearchBarTile(appId, tileId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/searchBar/:tileId')
  async deleteSearchBarTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.deleteSearchBarTile(appId, tileId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/video')
  async getVideoTiles(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.getVideoTiles(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/video')
  async addVideoTile(
    @Param('appId') appId: string,
    @Body() tile: VideoTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.addVideoTile(appId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/video/:tileId')
  async updateVideoTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @Body() tile: VideoTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.updateVideoTile(appId, tileId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/video/:tileId')
  async deleteVideoTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.deleteVideoTile(appId, tileId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/calendar')
  async getCalendarTiles(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.getCalendarTiles(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/calendar')
  async addCalendarTile(
    @Param('appId') appId: string,
    @Body() tile: CalendarTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.addCalendarTile(appId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/calendar/:tileId')
  async updateCalendarTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @Body() tile: CalendarTileDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.updateCalendarTile(appId, tileId, tile);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/calendar/:tileId')
  async deleteCalendarTile(
    @Param('appId') appId: string,
    @Param('tileId') tileId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.tilesService.deleteCalendarTile(appId, tileId);
  }
}
