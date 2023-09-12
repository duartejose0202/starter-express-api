import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { FoldersService } from './folders.service';
import { FolderItemDocument } from './folder-item.document';
import { ReorderDto } from '../shared/dtos/reorder.dto';

@Controller('/mobile/v1/apps/:appId/folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:folderId/items')
  async getFolderItems(
    @Param('appId') appId: string,
    @Param('folderId') folderId: string,
  ) {
    return await this.foldersService.getItems(appId, folderId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/:folderId/items')
  async addFolderItem(
    @Param('appId') appId: string,
    @Param('folderId') folderId: string,
    @Body() folderItem: FolderItemDocument,
  ) {
    return await this.foldersService.addItem(appId, folderId, folderItem);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/:folderId/items/reorder')
  async reorderFolderItems(
    @Param('appId') appId: string,
    @Param('folderId') folderId: string,
    @Body() reorderDto: ReorderDto,
  ) {
    return await this.foldersService.reorder(appId, folderId, reorderDto.ids);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/:folderId/items/:itemId')
  async deleteFolderItem(
    @Param('appId') appId: string,
    @Param('folderId') folderId: string,
    @Param('itemId') itemId: string,
  ) {
    return await this.foldersService.deleteItem(appId, folderId, itemId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Get('/:folderId/items/:itemId')
  async getFolderItem(
    @Param('appId') appId: string,
    @Param('folderId') folderId: string,
    @Param('itemId') itemId: string,
  ) {
    return await this.foldersService.getItem(appId, folderId, itemId);
  }
}
