import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { HomeElementDocument } from './home-element.document';

export class HomeElementsService extends FirestoreBaseService {
  async getHomeElements(appId: string): Promise<HomeElementDocument[]> {
    let homeElements: HomeElementDocument[];
    const homeElementResponse = await this.getCollection(
      appId,
      HomeElementDocument.collectionName,
    ).get();
    homeElements = homeElementResponse.docs.map((doc) =>
      doc.to(HomeElementDocument),
    );

    if (homeElements.length === 0) {
      const legacyHomeElementsResponse = await this.getCollection(
        appId,
        'homeElements',
      ).get();

      homeElements = legacyHomeElementsResponse.docs.map((doc) =>
        doc.to(HomeElementDocument),
      );
    }

    return homeElements;
  }

  async getHomeElement(appId: string, homeElementId: string): Promise<HomeElementDocument> {
    const snapshot = await this.getCollection(
      appId,
      HomeElementDocument.collectionName,
    ).doc(homeElementId).get();

    return snapshot.to(HomeElementDocument);
  }

  async updateHomeElement(appId: string, homeElement: any) {
    await this.getCollection<HomeElementDocument>(
      appId,
      HomeElementDocument.collectionName,
    ).doc(homeElement.id).set(homeElement, { merge: true });
  }

  async addHomeElement(appId: string, homeElement: HomeElementDocument) {
    await this.getCollection<HomeElementDocument>(
      appId,
      HomeElementDocument.collectionName,
    ).add(homeElement);
  }

  async saveHomeElements(appId: string, homeElements: HomeElementDocument[]) {
    const batch = this.app.firestore(appId).batch();
    const homeElementsCollection = this.getCollection<HomeElementDocument>(
      appId,
      HomeElementDocument.collectionName,
    );
    const homeElementsResponse = await homeElementsCollection.get();
    homeElementsResponse.docs.forEach((doc) => batch.delete(doc.ref));

    homeElements.forEach((homeElement) =>
      batch.set(homeElementsCollection.doc(), homeElement),
    );

    await batch.commit();
  }

  async deleteHomeElement(appId: string, homeElementId: string) {
    await this.getCollection<HomeElementDocument>(
      appId,
      HomeElementDocument.collectionName,
    )
      .doc(homeElementId)
      .delete();
  }
}
