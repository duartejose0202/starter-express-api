import { Module } from '@nestjs/common';
import { FreeSignupService } from './free-signup.service';
import { FreeSignupController } from './free-signup.controller';
import DatabaseModule from '../../../database/database.module';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FreeSignupController],
  providers: [FreeSignupService],
})
export class FreeSignupModule {}
