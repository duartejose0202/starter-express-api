import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';

export class IngredientDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'ingredients';

  readonly title?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
}
