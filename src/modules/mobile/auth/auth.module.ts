import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseModule } from '../../firestore/firebase.module';
import { MobileUsersModule } from "../users/mobile-users.module";

@Module({
  imports: [FirebaseModule, MobileUsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
