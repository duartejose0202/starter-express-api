import { Module } from '@nestjs/common';
import { AppDataModule } from './app_data/app-data.module';
import { CircuitsModule } from './circuits/circuits.module';
import { ProgramsModule } from './programs/programs.module';
import { MobileUsersModule } from './users/mobile-users.module';
import { AuthModule } from './auth/auth.module';
import { SectionsModule } from './sections/sections.module';
import { DaysModule } from './days/days.module';
import { PostsModule } from './posts/posts.module';
import { GoalsModule } from './goals/goals.module';
import { HomeElementsModule } from './home_elements/home-elements.module';
import { MessagesModule } from './messages/messages.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { ExerciseModule } from './exercise/exercise.module';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';
import { TilesModule } from './tiles/tiles.module';
import { CommunityModule } from './community/community.module';
import { ProductsModule } from "./products/products.module";
import { RecordsModule } from "./records/records.module";
import { CalendarModule } from "./calendar/calendar.module";
import { AIModule } from "./ai/ai.module";
import { RestrictionsModule } from "./restrictions/restrictions.module";

@Module({
  imports: [
    AppDataModule,
    CircuitsModule,
    ProgramsModule,
    MobileUsersModule,
    AuthModule,
    SectionsModule,
    DaysModule,
    PostsModule,
    GoalsModule,
    HomeElementsModule,
    MessagesModule,
    NutritionModule,
    ExerciseModule,
    FoldersModule,
    FilesModule,
    TilesModule,
    CommunityModule,
    ProductsModule,
    RecordsModule,
    CalendarModule,
    AIModule,
    RestrictionsModule
  ],
  controllers: [],
  providers: [],
})
export class MobileModule {}
