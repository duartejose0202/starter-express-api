import { FirestoreBaseDocument } from "../../firestore/firestore-base.document";
import { Transform } from "class-transformer";
import { Timestamp } from "@google-cloud/firestore";

export class PhotoDocument extends FirestoreBaseDocument {
  static readonly collectionName = 'photos';

  @Transform(({ value }) => Timestamp.fromDate(new Date(value)))
  readonly date: Timestamp;
  readonly imageUrl: string;
}
