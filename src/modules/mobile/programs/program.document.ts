import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class ProgramDocument extends FirestoreBaseDocument {
  static collectionName: string = 'programs';

  title?: string;
  subtitle?: string;
  customerId?: string;
  customers: string[] = [];
  videoUrl?: string;
  soundOn: boolean = true;
  imageUrl?: string;
  thumbnail?: string;
  showTitle?: string;
  pdfUrl?: string;
  linkUrl?: string;
  html?: string;
  complete?: boolean;
  locked?: boolean = false;
  visible?: boolean = true;
  tabs?: string[] = [];
  availablePlans ?: string[] = [];
  startAfterId?: string;
  weeksDelay?: number;
  daysDelay?: number;
  order: number = 0;
  daysUntilUnlock?: number;
  startAfterProgram?: ProgramDocument;
  tags?: string[] = [];
}
