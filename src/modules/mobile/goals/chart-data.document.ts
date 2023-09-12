import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";

export class ChartDataDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'charts';

  readonly title: string;
  items: ChartItemDocument[];
}

export class ChartItemDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'items';

  readonly itemType: 'exercise' | 'measurement';
  readonly itemId: string;
  readonly distanceUnit?: 'km' | 'm' | 'y' | 'mi';
  readonly distance?: number;
}
