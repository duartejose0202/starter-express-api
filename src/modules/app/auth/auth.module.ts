import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './strategies/local.startegy';
import { PassportModule } from '@nestjs/passport';
import AppConfig from '../../../configs/app.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesService } from '../roles/roles.service';
import { RolesModule } from '../roles/roles.module';
import DatabaseModule from '../../../database/database.module';
import { MailModule } from '../../mail/mail.module';
import TokenModule from '../token/token.module';
import TokenService from '../token/token.service';
import { StripeModule } from '../stripe/stripe.module';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { AppsModule } from '../apps/apps.module';
import { AppsService } from '../apps/apps.service';
import { MobileUsersModule as MobileUsersModule } from '../../mobile/users/mobile-users.module';
import { AppDataModule } from "../../mobile/app_data/app-data.module";

@Module({
  imports: [
    DatabaseModule,
    MobileUsersModule,
    AppDataModule,
    UsersModule,
    RolesModule,
    TokenModule,
    PassportModule,
    forwardRef(() => StripeConnectModule),
    AppsModule,
    MailModule,
    forwardRef(() => StripeModule),
    JwtModule.register({
      secret: AppConfig.APP.JWT_SECRET,
      signOptions: { expiresIn: AppConfig.APP.JWT_EXPIRE },
    }),
  ],
  providers: [
    AuthService,
    RolesService,
    TokenService,
    LocalStrategy,
    JwtStrategy,
    AppsService,
  ],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
