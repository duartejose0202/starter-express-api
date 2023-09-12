import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";
import { Transform } from "class-transformer";
import { Timestamp } from "@google-cloud/firestore";

export class CalendarEventDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'calendarEvents';

  title: string;
  description: string;
  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  startDate: Timestamp;
  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  endDate: Timestamp;
  programId?: string;
}
