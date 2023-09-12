import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class HomeElementDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'homeElementsV2';

  name: string;
  icon: string;
  index: number;
  readonly url?: string;
  readonly position: string;
  type: string;
  active: boolean = true;
  productList ?: string[] = [];
}
