import { Injectable, Logger } from '@nestjs/common';
import { CollectionReference } from '@google-cloud/firestore';
import { AppDataDocument } from '../mobile/app_data/app-data.document';
import { UserDocument } from '../mobile/users/user.document';
import { FirebaseApp } from './firebase-app.service';

@Injectable()
export abstract class FirestoreBaseService {
  constructor(protected app: FirebaseApp) {}

  readonly logger = new Logger(typeof this);

  protected getCollection<T>(
    appId: string,
    collectionName: string,
  ): CollectionReference<T> {
    return this.getAppCollection(appId)
      .doc(appId)
      .collection(collectionName) as CollectionReference<T>;
  }

  protected getUserCollection<T>(
    appId: string,
    userId: string,
    collectionName: string,
  ): CollectionReference<T> {
    return this.getCollection<UserDocument>(appId, UserDocument.collectionName)
      .doc(userId)
      .collection(collectionName) as CollectionReference<T>;
  }

  protected getAppCollection(appId: string) {
    return this.app.firestore(appId).collection(
      AppDataDocument.collectionName,
    ) as CollectionReference<AppDataDocument>;
  }
}
