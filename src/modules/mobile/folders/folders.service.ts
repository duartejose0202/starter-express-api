import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { FolderItemDocument } from './folder-item.document';
import { ProgramDocument } from '../programs/program.document';
import { NotFoundException } from '@nestjs/common';
import { FirebaseApp } from '../../firestore/firebase-app.service';
import { ProgramsService } from '../programs/programs.service';

export class FoldersService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    private programsService: ProgramsService,
  ) {
    super(app);
  }

  async getItems(
    appId: string,
    folderId: string,
  ): Promise<FolderItemDocument[]> {
    const result = await this.getCollection(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(folderId)
      .collection(FolderItemDocument.collectionName)
      .get();

    let rtn = result.docs.map((doc) => doc.to(FolderItemDocument));
    rtn = rtn.filter((item) => !!item.type);
    return rtn;
  }

  async getItem(
    appId: string,
    folderId: string,
    itemId: string,
  ): Promise<FolderItemDocument> {
    const result = await this.getCollection(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(folderId)
      .collection(FolderItemDocument.collectionName)
      .doc(itemId)
      .get();

    return result.to(FolderItemDocument);
  }

  async addItem(
    appId: string,
    folderId: string,
    item: FolderItemDocument,
  ): Promise<FolderItemDocument> {
    const result = await this.getCollection(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(folderId)
      .collection(FolderItemDocument.collectionName)
      .add(item);

    item.id = result.id;
    item.path = result.path;

    return item;
  }

  async reorder(appId: string, folderId: string, ids: string[]): Promise<void> {
    for (const i in ids) {
      const id = ids[parseInt(i)];
      if (id == null || id == '') continue;
      await this.getCollection(appId, ProgramDocument.collectionName)
        .doc(folderId)
        .collection(FolderItemDocument.collectionName)
        .doc(id)
        .set({ order: parseInt(i) }, { merge: true });
    }
  }

  async deleteItem(
    appId: string,
    folderId: string,
    itemId: string,
  ): Promise<void> {
    await this.getCollection(appId, ProgramDocument.collectionName)
      .doc(folderId)
      .collection(FolderItemDocument.collectionName)
      .doc(itemId)
      .delete();
  }

  async copyFolder(
    appId: string,
    customerId: string,
    folderId: string,
  ): Promise<ProgramDocument> {
    const response = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(folderId)
      .get();

    if (!response.exists) throw new NotFoundException();
    const folder = response.to(ProgramDocument);

    const copy = new ProgramDocument();
    Object.assign(copy, folder);
    copy.customerId = customerId;
    copy.title = `${copy.title} - copy`;

    const savedCopy = await this.programsService.createProgram(appId, copy);
    const items = await this.getItems(appId, folderId);

    for (const item of items) {
      switch (item.type) {
        case 'exercise':
          await this.addItem(appId, savedCopy.id, item);
          continue;
        case 'meal':
          await this.addItem(appId, savedCopy.id, item);
          continue;
        case 'folder':
        case 'carousel':
        case 'tabs':
        case 'singleTab':
          const f = await this.programsService.getProgram(appId, item.itemId);
          if (f) {
            const newFolder = await this.copyFolder(appId, customerId, f.id);
            const newItem = {
              itemId: newFolder.id,
              type: item.type,
              order: item.order,
            };
            await this.addItem(appId, savedCopy.id, newItem);
          }
          continue;
        case 'onePdf':
        case 'link':
          const p = await this.programsService.getProgram(appId, item.itemId);
          if (p) {
            const newProgram = new ProgramDocument();
            Object.assign(newProgram, p);
            newProgram.customerId = copy.id;
            const newSavedProgram = await this.programsService.createProgram(
              appId,
              newProgram,
            );
            const newItem = {
              itemId: newSavedProgram.id,
              type: item.type,
              order: item.order,
            };
            await this.addItem(appId, savedCopy.id, newItem);
          }
          continue;
        case 'oneVideo':
      }
    }

    return copy;

    // final folderItems = await folder.getSubCollection("items", converter: (doc) => FolderItem.fromSnapshot(doc));
    //
    // for (var item in folderItems) {

    //     case ItemType.oneVideo:
    //       final videoTile = TileRepo().videoTiles.firstWhereOrNull((e) => e.id == item.itemId);
    //       if (videoTile != null) {
    //         final newTile = VideoTile.fromJson(videoTile.toJson());
    //         final newTileRef = await TileRepo().addVideoTile(newTile);
    //
    //         var newItem = FolderItem();
    //         newItem.itemId = newTileRef.id;
    //         newItem.type = item.type;
    //         newItem.order = item.order;
    //
    //         await copy.reference!.collection("items").add(newItem.toJson());
    //       } else {
    //         final video = everySingleProgram.firstWhereOrNull((e) => e.id == item.itemId);
    //         if (video != null) {
    //           var newProgram = Program.fromJson(video.toJson());
    //           newProgram.customerId = copy.id;
    //           var newProgramRef = await ProgramRepo().addProgram(newProgram);
    //           var newItem = FolderItem();
    //           newItem.itemId = newProgramRef.id;
    //           newItem.type = item.type;
    //           newItem.order = item.order;
    //           await copy.reference!.collection("items").add(newItem.toJson());
    //         }
    //       }
    //       continue;
    //     default:
    //       continue;
    //   }
    // }
  }
}
