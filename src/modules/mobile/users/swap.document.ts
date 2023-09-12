import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class SwapDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'swaps';

  readonly assignmentId: string;
  readonly originalItemId: string;
  readonly replacementItemId: string;
}
