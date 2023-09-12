import { forwardRef, Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';
import { RolesModule } from '../roles/roles.module';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, UsersModule, RolesModule, forwardRef(() => AuthModule)],
  providers: [StripeConnectService, UsersService],
  controllers: [StripeConnectController],
  exports: [StripeConnectService],
})
export class StripeConnectModule {}
