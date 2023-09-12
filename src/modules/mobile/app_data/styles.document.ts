import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class StylesDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'theme';
  static readonly documentName = 'styles';

  font?: string;
  displayType?: string;
}
