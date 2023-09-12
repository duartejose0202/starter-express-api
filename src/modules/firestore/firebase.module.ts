import { FirebaseApp } from './firebase-app.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [FirebaseApp],
  exports: [FirebaseApp],
})
export class FirebaseModule {}
