import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class FolderItemDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'items';

  readonly type: string;
  readonly itemId: string;
  readonly order?: number;
}
