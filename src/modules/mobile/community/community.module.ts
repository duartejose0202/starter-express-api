import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { FirebaseModule } from 'src/modules/firestore/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
