import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';

export class SearchBarTileDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'searchBarTiles';

  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
  readonly hintText?: string;
}
