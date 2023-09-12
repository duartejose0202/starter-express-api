import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";

export class RecordDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'records';

  readonly itemId: string;
  readonly record?: number;
  readonly goal?: number;
  readonly distance?: number;
  readonly distanceUnit?: 'km' | 'm' | 'y' | 'mi';
}
