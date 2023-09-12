import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';

export class ImageTileDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'imageTiles';

  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
}
