import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class SectionDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'sections';

  readonly title?: string;
  readonly complete: boolean = false;
  readonly locked: boolean = false;
  readonly visible: boolean = true;
  readonly startAfterId?: string;
  readonly weeksDelay?: number;
  readonly daysDelay?: number;
  readonly color?: string;
  readonly order: number = 0;
  daysUntilUnlock?: number;
  startAfterSection?: SectionDocument;
  readonly exerciseDays: string[] = [];
  readonly mealDays: string[] = [];
}
