import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class MealDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'meals';

  readonly title?: string;
  readonly subtitle?: string;
  readonly description?: string;
  readonly videoUrl?: string;
  readonly soundOn?: boolean;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle?: boolean;
  readonly quillJson?: string;
  readonly pdfUrl?: string;
  readonly fat?: number;
  readonly protein?: number;
  readonly carbs?: number;
}
