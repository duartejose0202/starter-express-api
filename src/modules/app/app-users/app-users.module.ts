import { Module } from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import { AppUsersController } from './app-users.controller';
import DatabaseModule from 'src/database/database.module';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, StripeConnectModule, UsersModule, RolesModule, AuthModule],
  controllers: [AppUsersController],
  providers: [AppUsersService],
})
export class AppUsersModule {}
