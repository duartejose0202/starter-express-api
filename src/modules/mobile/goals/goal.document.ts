import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class GoalDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'goals';

  readonly title: string;
  readonly color?: string;
  global: boolean = false;
}
