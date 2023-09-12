import { Module } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';
import DatabaseModule from 'src/database/database.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SalesController],
  providers: [DatabaseService, SalesService],
  exports: [SalesService],
})
export class SalesModule {}
