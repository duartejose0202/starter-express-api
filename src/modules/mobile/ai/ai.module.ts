import { Module } from "@nestjs/common";
import { AIController } from "./ai.controller";
import { AIService } from "./ai.service";
import { FirebaseModule } from "../../firestore/firebase.module";
import { AppDataModule } from "../app_data/app-data.module";
import { MobileUsersModule } from "../users/mobile-users.module";
import { HomeElementsModule } from "../home_elements/home-elements.module";
import { ProgramsModule } from "../programs/programs.module";
import { FoldersModule } from "../folders/folders.module";
import { TilesModule } from "../tiles/tiles.module";

@Module({
  imports: [
    FirebaseModule,
    AppDataModule,
    MobileUsersModule,
    HomeElementsModule,
    ProgramsModule,
    FoldersModule,
    TilesModule
  ],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {
}
