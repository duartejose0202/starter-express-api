import { Module } from "@nestjs/common";
import { PhotosController } from "./photos.controller";
import { PhotosService } from "./photos.service";
import { FirebaseModule } from "../../firestore/firebase.module";

@Module({
  imports: [FirebaseModule],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {
}
