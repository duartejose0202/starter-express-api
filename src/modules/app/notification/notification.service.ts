import { Injectable } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';
import { NotificationRequestDto } from './dto/notification.request.dto';
import { NotificationReadRequestDto } from './dto/notification.read.request.dto';

@Injectable()
export class NotificationService {
  constructor(private dbService: DatabaseService) {}

  async createNotification(data: NotificationRequestDto) {
    return await this.dbService.notifications.create({
      data
    });
  }

  async findAllNotifications() {
    return await this.dbService.notifications.findMany({
      orderBy: {
        created_at: 'desc',
      },
      take: 5,
    });
  }

  async createNotificationRead(data: NotificationReadRequestDto) {
    const item = await this.dbService.notificationRead.findFirst({
      where: {
        user_id: data.user_id,
        notification_id: data.notification_id,
      }
    });

    if (item) {
      return item;
    }

    return await this.dbService.notificationRead.create({
      data
    });
  }

  async findNotificationReadByUserId(user_id: string) {
    return await this.dbService.notificationRead.findMany({
      where: {
        user_id: user_id,
      }
    });
  }
}
