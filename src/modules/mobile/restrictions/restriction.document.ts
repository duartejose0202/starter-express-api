import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";

export class RestrictionDocument extends FirestoreBaseDocument {
  static readonly collectionName = "restrictions";

  type: 'program' | 'feature';
  programId?: string;
  featureType?: string;
  products: string[] = [];
  productMap?: any;
}
