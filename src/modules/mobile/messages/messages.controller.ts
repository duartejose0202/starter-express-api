import { Body, Controller, Get, Param, Post, UseGuards, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { AuthUserDto } from '../auth/auth-user.dto';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { MessageDocument } from './message.document';

@Controller('/mobile/v1/apps/:appId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:userId')
  async getMessages(
    @Param('appId') appId: string,
    @Param('userId') userId: string,
  ) {
    return await this.messagesService.getMessages(appId, userId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/send_msg')
  async sendMessage(
    @Param('appId') appId: string,
    @Body() msg: MessageDocument,
  ) {
    return await this.messagesService.sendMessage(appId, msg);
  }
}
