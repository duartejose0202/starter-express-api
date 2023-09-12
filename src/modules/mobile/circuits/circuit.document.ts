import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class CircuitDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'circuits';

  readonly type: string = 'circuit';
  readonly notes: string = '';
  readonly rounds: number = 0;
  readonly countdown: number = 0;
  readonly order: number = 0;
  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
}
