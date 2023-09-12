import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";
import { Transform } from "class-transformer";
import { Timestamp } from "@google-cloud/firestore";

export class ExerciseEntryDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'entries';

  readonly order?: number;
  readonly weight?: number;
  readonly reps?: number;
  readonly distance?: number;
  readonly distanceUnit?: 'km' | 'm' | 'y' | 'mi';
  readonly notes?: string;
  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  readonly date: Timestamp;
  readonly time?: number;
  readonly assignmentId?: string;
}
