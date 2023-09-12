import { Module } from '@nestjs/common';
import { CircuitsController } from './circuits.controller';
import { CircuitsService } from './circuits.service';
import { FirebaseModule } from '../../firestore/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [CircuitsController],
  providers: [CircuitsService],
})
export class CircuitsModule {}
