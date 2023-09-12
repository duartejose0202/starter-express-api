import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';

export class VideoTileDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'videoTiles';

  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
  readonly videoUrl?: string;
  readonly soundOn: boolean = false;
  readonly playInPlace: boolean;
  readonly playOnStart: boolean;
}
