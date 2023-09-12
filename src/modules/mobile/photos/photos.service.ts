import { Injectable } from "@nestjs/common";
import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { PhotoDocument } from "./photo.document";

@Injectable()
export class PhotosService extends FirestoreBaseService {
  async getPhotos(appId: string, userId: string) {
    const result = await this.getUserCollection(appId, userId, PhotoDocument.collectionName)
      .get();

    return result.docs.map((doc) => doc.to(PhotoDocument));
  }

  async addPhoto(appId: string, userId: string, photo: PhotoDocument) {
    const result = await this.getUserCollection(appId, userId, PhotoDocument.collectionName)
      .add(photo);

    photo.id = result.id;
    photo.path = result.path;

    return photo;
  }

  async updatePhoto(appId: string, photoId: string, userId: string, photo: PhotoDocument) {
    if (photoId !== photo.id) {
      throw new Error("Photo ID mismatch");
    }

    await this.getUserCollection(appId, userId, PhotoDocument.collectionName)
      .doc(photo.id).set(photo, { merge: true });

    return photo;
  }
}
