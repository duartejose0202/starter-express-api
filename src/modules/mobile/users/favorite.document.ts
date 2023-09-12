import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class FavoriteDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'favorites';

  readonly itemId: string;
  readonly type: string;
}
