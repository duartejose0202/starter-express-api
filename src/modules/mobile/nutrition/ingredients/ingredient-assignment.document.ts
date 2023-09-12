import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';

export class IngredientAssignmentDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'ingredients';

  readonly itemId?: string;
  readonly quantity?: string;
  readonly order: number;
}
