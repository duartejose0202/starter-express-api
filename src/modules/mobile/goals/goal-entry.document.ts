import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Transform } from "class-transformer";

export class GoalEntryDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'entries';

  goalId: string;
  readonly value: number;

  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  readonly date: Timestamp;
}
