import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import { AppsService } from './apps.service';
import { AppDataModule } from "../../mobile/app_data/app-data.module";

@Module({
  imports: [DatabaseModule, AppDataModule],
  providers: [AppsService],
  exports: [AppsService],
})
export class AppsModule {}
