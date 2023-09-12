import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { UploadFileResponseDto } from './upload-file-response.dto';

@Injectable()
export class FilesService extends FirestoreBaseService {
  async uploadImage(
    appId: string,
    file: Express.Multer.File,
  ): Promise<UploadFileResponseDto> {
    const bucket = this.app.storage().bucket();
    const fileUpload = bucket.file(`images/${appId}/${file.originalname}`);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public,max-age=3600,s-maxage=3600',
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        fileUpload.makePublic().then(() => {
          resolve({
            url: fileUpload.publicUrl() + '?alt=media',
          });
        });
      });

      stream.end(file.buffer);
    });
  }

  async getImages(
    appId: string,
  ): Promise<string[]> {
    const bucket = this.app.storage().bucket();
    const files = await bucket.getFiles({
      prefix: `images/${appId}/`,
    });

    return files[0].map((file) => {
      return file.publicUrl() + '?alt=media';
    });
  }

  async uploadPDF(
    appId: string,
    file: Express.Multer.File,
  ): Promise<UploadFileResponseDto> {
    const bucket = this.app.storage().bucket();
    const fileUpload = bucket.file(`pdfs/${appId}/${file.originalname}`);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'public,max-age=3600,s-maxage=3600',
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        fileUpload.makePublic().then(() => {
          resolve({
            url: fileUpload.publicUrl(),
          });
        });
      });

      stream.end(file.buffer);
    });
  }

  async uploadVideo(
    appId: string,
    file: Express.Multer.File,
  ): Promise<UploadFileResponseDto> {
    // TODO resize video

    const bucket = this.app.storage().bucket();
    const fileUpload = bucket.file(`videos/${appId}/${file.originalname}`);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public,max-age=3600,s-maxage=3600',
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        fileUpload.makePublic().then(() => {
          resolve({
            url: fileUpload.publicUrl(),
          });
        });
      });

      stream.end(file.buffer);
    });
  }
}
