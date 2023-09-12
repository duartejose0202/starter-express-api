import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';
import { Transform } from 'class-transformer';

export class PostDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'posts';

  readonly text: string;

  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  readonly time: Timestamp;

  readonly image?: string;
  readonly video?: string;
  readonly link?: string;
  readonly likes: string[] = [];
  readonly comments: string[] = [];
  readonly isPinned: boolean;
  readonly userId: string;
  readonly name: string;
  readonly email?: string;
  readonly profilePicUrl?: string;
  readonly audioUrl?: string;
  readonly reported: boolean;
  readonly hidden: boolean;
  readonly communityId?: string;
}
