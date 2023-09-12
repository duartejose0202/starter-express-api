import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';
import { Transform } from "class-transformer";

export class ProgressDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'progress';

  @Transform(({ value }) => {
    if (value == null) return null;
    return Timestamp.fromDate(new Date(value));
  })
  readonly startDate: Timestamp | null;

  readonly itemId?: string;
}
