import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";
import { CurrentUser } from "../../../core/decorators/currentUser.decorator";
import { AuthUserDto } from "../auth/auth-user.dto";
import { RecordDocument } from "./record.document";

@Controller('/mobile/v1/apps/:appId/user/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getRecords(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.recordsService.getRecords(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/')
  async addRecord(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() record: RecordDocument
  ) {
    return await this.recordsService.addRecord(appId, user.id, record);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:recordId')
  async updateRecord(
    @Param('appId') appId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() record: RecordDocument
  ) {
    return await this.recordsService.updateRecord(appId, user.id, recordId, record);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/:recordId')
  async deleteRecord(
    @Param('appId') appId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.recordsService.deleteRecord(appId, user.id, recordId);
  }
}
