import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class ExerciseAssignmentDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'assignments';

  readonly type = 'exercise';
  readonly isSubset: boolean = false;
  readonly newIsSubset: boolean = false;
  readonly isSuperset: boolean = false;
  readonly isCircuit: boolean = false;
  readonly notes: string = '';
  readonly sets?: number;
  readonly rest?: number;
  readonly duration?: number;
  readonly distance?: number;
  readonly order: number = 0;
  readonly itemId?: string;
  readonly isSwap: boolean = false;
  readonly reps?: number[];
  readonly times?: number[];
  readonly effortPerSet?: number[];
  readonly rpePerSet?: number[];
  readonly percentOf1RM?: number[];
  readonly custom?: Map<string, any>;
  assignmentIds: string[] = [];
}
