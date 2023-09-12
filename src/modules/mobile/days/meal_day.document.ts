import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class MealDayDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'mealDays';

  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
  readonly pdfUrl?: string;
  readonly order: number = 0;
  readonly itemIds: string[] = [];
}
