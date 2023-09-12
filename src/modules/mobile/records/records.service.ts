import { Injectable } from "@nestjs/common";
import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { RecordDocument } from "./record.document";

@Injectable()
export class RecordsService extends FirestoreBaseService {
  async getRecords(appId: string, userId: string) {
    const response = await this.getUserCollection(
      appId,
      userId,
      RecordDocument.collectionName
    ).get();
    return response.docs.map((doc) => doc.to(RecordDocument));
  }

  async addRecord(appId: string, userId: string, record: RecordDocument) {
    const result = await this.getUserCollection(
      appId,
      userId,
      RecordDocument.collectionName
    ).add(record);

    record.id = result.id;
    record.path = result.path;

    return record;
  }

  async updateRecord(appId: string, userId: string, recordId: string, record: RecordDocument) {
    if (recordId !== record.id) {
      throw new Error("Record ID mismatch");
    }

    await this.getUserCollection(
      appId,
      userId,
      RecordDocument.collectionName
    ).doc(record.id).set(record, { merge: true });

    return record;
  }

  async deleteRecord(appId: string, userId: string, recordId: string) {
    await this.getUserCollection(
      appId,
      userId,
      RecordDocument.collectionName
    ).doc(recordId).delete();
  }
}
