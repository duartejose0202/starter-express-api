import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';
import { firestore } from 'firebase-admin';
import { Transform } from "class-transformer";
import Timestamp = firestore.Timestamp;
import { IsString } from "class-validator";

export class LoggedMealDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'meals';

  readonly title: string;

  @Transform(({value}) => Timestamp.fromDate(new Date(value)))
  readonly time: Timestamp;

  @Transform(({value}) => Timestamp.fromDate(new Date(value)))
  readonly date: Timestamp;

  readonly itemIds: string[];
}
