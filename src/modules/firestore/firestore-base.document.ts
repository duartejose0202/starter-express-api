import { firestore } from 'firebase-admin';
import DocumentSnapshot = firestore.DocumentSnapshot;

export class FirestoreBaseDocument {
  id?: string;
  path?: string;
  order?: number;
  restricted?: boolean = false;
}

declare module '@google-cloud/firestore' {
  interface DocumentSnapshot {
    to<T extends FirestoreBaseDocument>(type: new () => T): T;
  }
}

DocumentSnapshot.prototype.to = function <T extends FirestoreBaseDocument>(
  type: new () => T,
): T {
  const object = new type();
  Object.assign(object, this.data());
  object.id = this.id;
  object.path = this.ref.path;

  for (let key of Object.keys(object)) {
    if (object[key] instanceof firestore.Timestamp) {
      object[key] = object[key].toDate();
    }
  }

  return object;
};
