import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import { RolesController } from './role.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
