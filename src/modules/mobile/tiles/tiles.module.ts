import { Module } from '@nestjs/common';
import { TilesController } from './tiles.controller';
import { TilesService } from './tiles.service';
import { FirebaseModule } from '../../firestore/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [TilesController],
  providers: [TilesService],
  exports: [TilesService],
})
export class TilesModule {}
