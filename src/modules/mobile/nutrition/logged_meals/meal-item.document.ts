import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Transform } from "class-transformer";

export class MealItemDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'mealItems';

  readonly title: string;
  readonly calories: number;
  readonly carbs: number;
  readonly fat: number;
  readonly protein: number;

  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  readonly time: Timestamp;

  readonly servingQuantity: number;
  readonly servingSize: string;
  readonly servingsConsumed?: number;
  readonly imageUrl?: string;
  readonly associatedId?: string;
}
