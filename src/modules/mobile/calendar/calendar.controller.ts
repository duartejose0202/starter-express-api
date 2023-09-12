import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";
import { CurrentUser } from "../../../core/decorators/currentUser.decorator";
import { AuthUserDto } from "../auth/auth-user.dto";
import { CalendarEventDocument } from "./calendar-event.document";

@Controller('/mobile/v1/apps/:appId/calendarEvents')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getCalendarEvents(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.calendarService.getCalendarEvents(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/')
  async addCalendarEvent(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() event: CalendarEventDocument,
  ) {
    return await this.calendarService.addCalendarEvent(appId, user.id, event);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:eventId')
  async updateCalendarEvent(
    @Param('appId') appId: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() event: CalendarEventDocument,
  ) {
    return await this.calendarService.updateCalendarEvent(appId, user.id, event);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/:eventId')
  async deleteCalendarEvent(
    @Param('appId') appId: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.calendarService.deleteCalendarEvent(appId, user.id, eventId);
  }
}
