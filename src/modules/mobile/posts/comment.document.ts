import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';
import { Timestamp } from '@google-cloud/firestore';

export class CommentDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'comment';

  text: string;
  name?: string;
  email: string;
  image?: string;
  time: Timestamp;
  profilePicUrl?: string;
  userId?: string;
  audioUrl?: string;
  hidden: boolean;
  reported: boolean;
  tags?: string[];
}
