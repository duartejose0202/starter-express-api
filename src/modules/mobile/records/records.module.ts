import { Module } from "@nestjs/common";
import { RecordsController } from "./records.controller";
import { RecordsService } from "./records.service";
import { FirebaseModule } from "../../firestore/firebase.module";

@Module({
  imports: [FirebaseModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {
}
