import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { TextTileDocument } from './documents/text-tile.document';
import { ImageTileDocument } from './documents/image-tile.document';
import { VideoTileDocument } from './documents/video-tile.document';
import { SearchBarTileDocument } from './documents/search-bar-tile.document';
import { CalendarTileDocument } from "./documents/calendar-tile.document";

@Injectable()
export class TilesService extends FirestoreBaseService {
  async getTextTiles(appId: string): Promise<TextTileDocument[]> {
    const result = await this.getCollection(
      appId,
      TextTileDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(TextTileDocument));
  }

  async addTextTile(appId: string, tile: TextTileDocument): Promise<TextTileDocument> {
    const response = await this.getCollection(appId, TextTileDocument.collectionName)
      .add(tile);

    tile.id = response.id;
    return tile;
  }

  async updateTextTile(appId: string, tileId: string, tile: TextTileDocument) {
    if (tile.id && tile.id !== tileId) throw new Error('Tile id mismatch');

    await this.getCollection(appId, TextTileDocument.collectionName)
      .doc(tileId)
      .set(tile, { merge: true });
  }

  async deleteTextTile(appId: string, tileId: string) {
    await this.getCollection(appId, TextTileDocument.collectionName)
      .doc(tileId)
      .delete();
  }

  async getImageTiles(appId: string): Promise<ImageTileDocument[]> {
    const result = await this.getCollection(
      appId,
      ImageTileDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(ImageTileDocument));
  }

  async addImageTile(appId: string, tile: ImageTileDocument): Promise<ImageTileDocument> {
    const response = await this.getCollection(appId, ImageTileDocument.collectionName)
      .add(tile);

    tile.id = response.id;
    return tile;
  }

  async updateImageTile(
    appId: string,
    tileId: string,
    tile: ImageTileDocument,
  ) {
    if (tile.id && tile.id !== tileId) throw new Error('Tile id mismatch');

    await this.getCollection(appId, ImageTileDocument.collectionName)
      .doc(tileId)
      .set(tile, { merge: true });
  }

  async deleteImageTile(appId: string, tileId: string) {
    await this.getCollection(appId, ImageTileDocument.collectionName)
      .doc(tileId)
      .delete();
  }

  async getVideoTiles(appId: string): Promise<VideoTileDocument[]> {
    const result = await this.getCollection(
      appId,
      VideoTileDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(VideoTileDocument));
  }

  async addVideoTile(appId: string, tile: VideoTileDocument): Promise<VideoTileDocument> {
    const response = await this.getCollection(appId, VideoTileDocument.collectionName)
      .add(tile);

    tile.id = response.id;
    return tile;
  }

  async updateVideoTile(
    appId: string,
    tileId: string,
    tile: VideoTileDocument,
  ) {
    if (tile.id && tile.id !== tileId) throw new Error('Tile id mismatch');

    await this.getCollection(appId, VideoTileDocument.collectionName)
      .doc(tileId)
      .set(tile, { merge: true });
  }

  async deleteVideoTile(appId: string, tileId: string) {
    await this.getCollection(appId, VideoTileDocument.collectionName)
      .doc(tileId)
      .delete();
  }

  async getSearchBarTiles(appId: string): Promise<SearchBarTileDocument[]> {
    const result = await this.getCollection(
      appId,
      SearchBarTileDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(SearchBarTileDocument));
  }

  async addSearchBarTile(appId: string, tile: SearchBarTileDocument): Promise<SearchBarTileDocument> {
    const response = await this.getCollection(appId, SearchBarTileDocument.collectionName)
      .add(tile);

    tile.id = response.id;
    return tile;
  }

  async updateSearchBarTile(
    appId: string,
    tileId: string,
    tile: SearchBarTileDocument,
  ) {
    if (tile.id && tile.id !== tileId) throw new Error('Tile id mismatch');

    await this.getCollection(appId, SearchBarTileDocument.collectionName)
      .doc(tileId)
      .set(tile, { merge: true });
  }

  async deleteSearchBarTile(appId: string, tileId: string) {
    await this.getCollection(appId, SearchBarTileDocument.collectionName)
      .doc(tileId)
      .delete();
  }

  async getCalendarTiles(appId: string): Promise<CalendarTileDocument[]> {
    const result = await this.getCollection(
      appId,
      CalendarTileDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(CalendarTileDocument));
  }

  async addCalendarTile(appId: string, tile: CalendarTileDocument): Promise<CalendarTileDocument> {
    const response = await this.getCollection(appId, CalendarTileDocument.collectionName)
      .add(tile);

    tile.id = response.id;
    tile.path = response.path;
    return tile;
  }

  async updateCalendarTile(
    appId: string,
    tileId: string,
    tile: CalendarTileDocument,
  ) {
    if (tile.id && tile.id !== tileId) throw new Error('Tile id mismatch');

    await this.getCollection(appId, CalendarTileDocument.collectionName)
      .doc(tileId)
      .set(tile, { merge: true });
  }

  async deleteCalendarTile(appId: string, tileId: string) {
    await this.getCollection(appId, CalendarTileDocument.collectionName)
      .doc(tileId)
      .delete();
  }
}
