import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/guards/jwt.guard';
import { NotificationService } from './notification.service';
import { NotificationRequestDto } from './dto/notification.request.dto';
import { NotificationReadRequestDto } from './dto/notification.read.request.dto';

@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('item/create')
  createNotification(@Body() data: NotificationRequestDto) {
    return this.notificationService.createNotification(data);
  }

  @Get('item/all')
  getAllNotifications() {
    return this.notificationService.findAllNotifications();
  }

  @Post('item/read')
  createNotificationRead(@Body() data: NotificationReadRequestDto) {
    return this.notificationService.createNotificationRead(data);
  }

  @Get('read/:user_id')
  getNotificationReadByUserId(@Param('user_id') user_id: string) {
    return this.notificationService.findNotificationReadByUserId(user_id);
  }
}
