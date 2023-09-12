import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Transform } from 'class-transformer';
import { FirestoreBaseDocument } from 'src/modules/firestore/firestore-base.document';

export class CommunityDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'community';

  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  readonly createdAt: Timestamp;

  readonly imagePath?: string;
  readonly name?: string;
  readonly newPostCount?: string;
  readonly userId: string;
  readonly communityId: string;
  readonly members?: Member[];
  readonly isPublic: boolean;
  readonly isIcon: boolean;
  readonly icon: number;
}

export class Member {
  name?: string;
  profileUrl?: string;
  email?: string;
}
