import { FirestoreBaseDocument } from '../../../firestore/firestore-base.document';

export class CalendarTileDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'calendarTiles';

  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
  readonly text: string;
  readonly showBackground: boolean = true;
  readonly expandable: boolean = false;
}
