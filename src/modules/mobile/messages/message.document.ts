import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export class MessageDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'messages';

  readonly fromId: string;
  readonly toId: string;
  readonly imageUrl?: string;
  readonly videoUrl?: string;
  readonly message: string;
  readonly read: boolean;
  readonly time: Timestamp;

  fromMe: boolean;
}
