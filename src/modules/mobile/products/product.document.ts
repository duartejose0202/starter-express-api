import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";

export class ProductCategoryDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'products';

  readonly title?: string;
  readonly color?: string;
}

export class ProductDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'products';

  readonly title?: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly price?: string;
  readonly showTitle?: boolean;
  readonly link?: string;
  readonly affiliate?: string;
}
