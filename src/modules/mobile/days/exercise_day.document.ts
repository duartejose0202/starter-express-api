import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class ExerciseDayDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'exerciseDays';

  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
  readonly pdfUrl?: string;
  readonly order: number = 0;
}
