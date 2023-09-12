import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';
import { ExerciseAssignmentDocument } from './exercise_assignment.document';

export class ExerciseDocument extends FirestoreBaseDocument {
  static readonly collectionName: string = 'exercises';

  readonly title?: string;
  readonly subtitle?: string;
  readonly description?: string;
  readonly videoUrl?: string;
  readonly soundOn: boolean = true;
  readonly imageUrl?: string;
  readonly thumbnail?: string;
  readonly showTitle: boolean = true;
  readonly isDefault: boolean = false;
  readonly pdfUrl?: string;
  readonly openLog: boolean = false;
  readonly singleRepMax: boolean = false;
  readonly alternates: string[] = [];
  readonly logType?: string;
  readonly defaultAssignment?: ExerciseAssignmentDocument;
}
