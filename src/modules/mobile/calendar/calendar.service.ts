import { Injectable } from "@nestjs/common";
import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { CalendarEventDocument } from "./calendar-event.document";

@Injectable()
export class CalendarService extends FirestoreBaseService {
  async getCalendarEvents(appId: string, userId: string) {
    const result = await this.getUserCollection(
      appId,
      userId,
      CalendarEventDocument.collectionName
    ).get();

    return result.docs.map((doc) => doc.to(CalendarEventDocument));
  }

  async addCalendarEvent(appId: string, userId: string, event: CalendarEventDocument) {
    const result = await this.getUserCollection(
      appId,
      userId,
      CalendarEventDocument.collectionName
    ).add(event);


    event.id = result.id;
    event.path = result.path;

    return event;
  }

  async updateCalendarEvent(appId: string, userId: string, event: CalendarEventDocument) {
    const result = await this.getUserCollection(
      appId,
      userId,
      CalendarEventDocument.collectionName
    ).doc(event.id).update(event);

    return event;
  }

  async deleteCalendarEvent(appId: string, userId: string, eventId: string) {
    await this.getUserCollection(
      appId,
      userId,
      CalendarEventDocument.collectionName
    ).doc(eventId).delete();
  }
}
