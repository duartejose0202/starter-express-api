import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as twilio from 'twilio';
import { UsersService } from '../users/users.service';
import { ComparePassword, GenerateUUID, splitName } from '../../../helpers/util.helper';
import { AuthResponseDto, SalesResponseDto } from './dto/response/auth.response.dto';
import { RolesService } from '../roles/roles.service';
import { Roles } from '../../../constants';
import { MailService } from '../../mail/mail.service';
import { ForgotPasswordResponseDto } from './dto/response/forgot-password.response.dto';
import { App, PasswordToken, Role, User } from '@prisma/client';
import TokenService from '../token/token.service';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request';
import { StripeService } from '../stripe/stripe.service';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { AppsService } from '../apps/apps.service';
import DatabaseService from '../../../database/database.service';
import { MobileUsersService } from "../../mobile/users/mobile-users.service";
import axios from "axios";
import AppConfig from "../../../configs/app.config";
import { differenceInDays } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly appsService: AppsService,
    private readonly mobileUsersService: MobileUsersService,
    private stripeService: StripeService,
    private stripeConnectService: StripeConnectService,
    private _dbService: DatabaseService,
  ) {
  }

  async dashboardLogin(
    email: string,
    password: string,
  ): Promise<AuthResponseDto> {
    return this.login(email, password);
  }

  async socialLogin(data: any): Promise<AuthResponseDto> {
    const { email } = data;
    const user: User = await this.usersService.getUserByEmail(email);
    if (!user) {
      const { first_name, last_name } = splitName(data.name);
      return this.ownerSignup({
        ...data,
        first_name,
        last_name,
        signup_status: 'discover',
      });
    }
    return this.login(email, '', true, true);
  }

  async login(
    email: string,
    password: string,
    isDashboardLogin = true,
    isSocialLogin = false,
  ): Promise<AuthResponseDto | SalesResponseDto> {
    const user: User = await this.usersService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Email not found');
    }
    const role: Role = await this.rolesService.getRoleById(user.role_id);
    if (isDashboardLogin && role.name === Roles.APP_USER) {
      throw new BadRequestException(
        'Your are not allowed to log into the dashboard',
      );
    }
    const isPasswordMatched = isSocialLogin
      ? true
      : await ComparePassword(password, user.password);
    if (!isPasswordMatched) {
      throw new BadRequestException('Invalid password');
    }

    if (user.signup_status !== 'completed' && user.free_trial_end_date != null && differenceInDays(user.free_trial_end_date!, new Date()) - 1 < 0) {
      user.subscription_status = 'unpaid';
      user.subscription_id = 'unpaid';
      await this.usersService.updateOwner({
        subscription_status: 'unpaid',
        subscription_id: '',
      });
    }

    const subdata = await this.stripeService.getStatusAndRemainDays(user.subscription_id);

    if (role.name === Roles.APP_OWNER && user.signup_status !== 'complete') {
      const appInfo = await this.getAppInfoForAdmin(user.id);

      return {
        access_token: this.jwtService.sign(user),
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        email: user.email,
        mgp_commission: user.mgp_commission,
        email_verified_at: user?.email_verified_at?.toDateString() || '',
        remember_token: user.remember_token,
        google_id: user.google_id,
        facebook_id: user.google_id,
        role: role,
        userApp: appInfo,
        payment_plan: user.payment_plan,
        payment_period: user.payment_period,
        subscription_id: user.subscription_id,
        subscription_status: subdata.status,
        remain_fix_days: subdata.remain,
        signup_status: user.signup_status,
        check_schedule: user.check_schedule,
        free_trial_end_date: user.free_trial_end_date,
      };
    }

    const res = await this._dbService.stripeConnect.findFirst({
      where: { userId: user.id },
    });

    if (isDashboardLogin && role.name === Roles.SALESPERSON) {
      const commission = await this._dbService.commissions.findUnique({
        where: {
          salesperson_id: user.id,
        },
      });
      return {
        access_token: this.jwtService.sign(user),
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: null,
        email: user.email,
        mgp_commission: null,
        commission: commission,
        email_verified_at: user?.email_verified_at?.toDateString() || '',
        remember_token: user.remember_token,
        google_id: null,
        facebook_id: null,
        role: role,
        userApp: null,
        payment_plan: null,
        payment_period: null,
        subscription_id: null,
        subscription_status: null,
        remain_fix_days: null,
        account: res?.stripeAccountId,
        signup_status: null,
        free_trial_end_date: user.free_trial_end_date,
      };
    }

    const appInfo = await this.getAppInfoForAdmin(user.id);

    return {
      access_token: this.jwtService.sign(user),
      id: user.id,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      email: user.email,
      mgp_commission: user.mgp_commission,
      email_verified_at: user?.email_verified_at?.toDateString() || '',
      remember_token: user.remember_token,
      google_id: user.google_id,
      facebook_id: user.google_id,
      role: role,
      userApp: appInfo,
      payment_plan: user.payment_plan,
      payment_period: user.payment_period,
      subscription_id: user.subscription_id,
      subscription_status: subdata.status,
      remain_fix_days: subdata.remain,
      account: res?.stripeAccountId,
      signup_status: user.signup_status,
      check_schedule: user.check_schedule,
      free_trial_end_date: user.free_trial_end_date,
    };
  }

  async loginToAdminAccount(
    email: string,
    isDashboardLogin = true,
  ): Promise<AuthResponseDto | SalesResponseDto> {
    const user: User = await this.usersService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Email not found');
    }
    const role: Role = await this.rolesService.getRoleById(user.role_id);
    if (isDashboardLogin && role.name === Roles.APP_USER) {
      throw new BadRequestException(
        'Your are not allowed to log into the dashboard',
      );
    }

    const subdata = await this.stripeService.getStatusAndRemainDays(user.subscription_id);

    const res = await this._dbService.stripeConnect.findFirst({
      where: { userId: user.id },
    });

    if (role.name === Roles.SALESPERSON) {
      const commission = await this._dbService.commissions.findUnique({
        where: {
          salesperson_id: user.id,
        },
      });
      return {
        access_token: this.jwtService.sign(user),
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: null,
        email: user.email,
        mgp_commission: null,
        commission: commission,
        email_verified_at: user?.email_verified_at?.toDateString() || '',
        remember_token: user.remember_token,
        google_id: null,
        facebook_id: null,
        role: role,
        userApp: null,
        payment_plan: null,
        payment_period: null,
        subscription_id: null,
        subscription_status: null,
        remain_fix_days: null,
        account: res?.stripeAccountId,
        signup_status: null,
        free_trial_end_date: user.free_trial_end_date,
      };
    }

    const appInfo = await this.getAppInfo(user.id);
    if (!appInfo) {
      throw new InternalServerErrorException('auth.login_user_app_not_found');
    }

    return {
      access_token: this.jwtService.sign(user),
      id: user.id,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      //avatar: user.avatar,
      email: user.email,
      mgp_commission: user.mgp_commission,
      email_verified_at: user?.email_verified_at?.toDateString() || '',
      remember_token: user.remember_token,
      google_id: user.google_id,
      facebook_id: user.facebook_id,
      role: role,
      userApp: appInfo,
      account: res?.stripeAccountId,
      payment_plan: user.payment_plan,
      payment_period: user.payment_period,
      subscription_id: user.subscription_id,
      subscription_status: subdata.status,
      remain_fix_days: subdata.remain,
      signup_status: user.signup_status,
      check_schedule: user.check_schedule,
      free_trial_end_date: user.free_trial_end_date,
    };
  }

  async salesRegister(data: any): Promise<SalesResponseDto> {
    const role: Role = await this.rolesService.getRoleByName(Roles.SALESPERSON);
    const existingUser: User | null = await this.usersService.getUserByEmail(
      data.email,
    );
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }
    const user: User = await this.usersService.createSalesUser({
      ...data,
      roleId: role.id,
    });
    if (!user) {
      throw new BadRequestException('Fail to create user');
    }

    return {
      access_token: this.jwtService.sign(user),
      id: user.id,
      name: user.name,
      email: user.email,
      mgp_commission: null,
      email_verified_at: user?.email_verified_at?.toDateString() || '',
      remember_token: user.remember_token,
      google_id: null,
      facebook_id: null,
      role: role,
      //@ts-ignore
      commission: user.commissions,
      userApp: null,
      first_name: user?.first_name,
      last_name: user?.last_name,
      free_trial_end_date: user.free_trial_end_date,
    };
  }

  async ownerSignup(data: any): Promise<AuthResponseDto> {
    const role: Role = await this.rolesService.getRoleByName(Roles.APP_OWNER);
    let existingUser: User | null = await this.usersService.getUserByEmail(
      data.email,
    );


    if (existingUser) {
      throw new BadRequestException('Email is already registered. Please sign in.');
    }

    const firebaseApp = await this.mobileUsersService.createNewApp({
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
    });
    if (!firebaseApp) {
      throw new BadRequestException('Failed to create firebase app');
    }

    let promises: Promise<any>[] = [];
    promises.push(this.notifyZapier(data.first_name, data.last_name, data.email, data.phone_number, 'incomplete'));
    promises.push(this.usersService.createOwner({
      ...data,
      roleId: role.id,
    }));

    const results = await Promise.all(promises);

    const user = results[1];
    if (!user) {
      throw new BadRequestException('Failed to create user');
    }

    const app = await this.appsService.createApp({
      bussinessName: '',
      industryId: '',
      industryOther: '',
      website: '',
      mgpCommission: 15,
      logo: '',
      showLogo: false,
      appName: '',
      firebaseAppId: firebaseApp.id,
      appIcon: '',
      appBanner: '',
      socialMedia: '',
      socialMediaHandler: '',
      checklist: '',
      iosAppLink: '',
      andriodAppLink: '',
      webAppLink: '',
      userId: user.id,
    });
    if (!app) {
      throw new InternalServerErrorException('Failed to create user app');
    }

    return {
      access_token: this.jwtService.sign(user),
      id: user.id,
      name: user.name,
      email: user.email,
      mgp_commission: user.mgp_commission,
      email_verified_at: user?.email_verified_at?.toDateString() || '',
      remember_token: user.remember_token,
      google_id: user.google_id,
      facebook_id: user.facebook_id,
      role: role,
      userApp: app,
      first_name: user?.first_name,
      last_name: user?.last_name,
      signup_status: user.signup_status,
      check_schedule: user.check_schedule,
      firebase_app_id: firebaseApp.id,
      free_trial_end_date: user.free_trial_end_date,
    };
  }

  private async notifyZapier(firstName: string, lastName: string, email: string, phone: string, status: string) {
    const response = await axios.post(
      AppConfig.ZAPIER.WEBHOOK_URL,
      {
        firstName,
        lastName,
        email,
        phone,
        status
      }
    );

    if (response.status != 200) {
      console.log(response);
    }
  }

  async ownerUpdate(data: any): Promise<any> {
    const existingUser: User | null = await this.usersService.getUserById(
      data.id,
    );
    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    if (data.email) {
      const emailUser: User | null = await this.usersService.getUserByEmail(
        data.email,
      );
      if (emailUser && emailUser.id !== data.id) {
        throw new BadRequestException('Email already exist');
      }
    }

    const user: User = await this.usersService.updateOwner({
      ...data,
    });

    if (data.subscription_id != null) {
      await this.notifyZapier(
        existingUser.first_name,
        existingUser.last_name,
        existingUser.email,
        existingUser.phone_number,
        'paid'
      );
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  async ownerGetCode(phone: string): Promise<any> {
    const client = twilio(AppConfig.TWILIO.ACCOUNT_SID, AppConfig.TWILIO.AUTH_TOKEN)

    try {
      const verification = await client.verify.services(AppConfig.TWILIO.SERVICE_SID).verifications.create({
        to: `+${phone}`,
        channel: 'sms',
      });

      return {
        status: verification.status,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to get code');
    }
  }

  async ownerVerifyCode(phone: string, code: string): Promise<any> {
    const client = twilio(AppConfig.TWILIO.ACCOUNT_SID, AppConfig.TWILIO.AUTH_TOKEN)

    try {
      const verificationCheck = await client.verify.services(AppConfig.TWILIO.SERVICE_SID).verificationChecks.create({
        to: `+${phone}`,
        code: code,
      });

      return {
        status: verificationCheck.status,
      };
    } catch (error) {
      throw new BadRequestException('Failed to verify code');
    }
  }

  async appUpdate(data: any): Promise<any> {
    if (!data.userId) {
      throw new BadRequestException('Correspondent UserId not found');
    }

    return await this.appsService.updateApp({
      ...data,
    });
  }

  async checkByAppName(userId: string, name: string): Promise<any> {
    const appInfo = await this.appsService.getAppByName(name);
    if (appInfo && appInfo.userId !== userId) {
      throw new BadRequestException('App name is already registered');
    }

    return {};
  }

  async editCustomer(data: any, id: string): Promise<any> {
    data.name = '';
    data.mgp_commission = parseFloat(data.mgp_commission);
    const role: Role = await this.rolesService.getRoleByName(Roles.APP_USER);
    data.role_id = role.id;

    await this.usersService.editCustomer(data, id);

    return 'You have updated an user successfully';
  }

  async createCustomer(userData: any): Promise<any> {
    const data = userData;
    data.name = '';

    const role: Role = await this.rolesService.getRoleByName(Roles.APP_USER);

    const existingUser: User | null = await this.usersService.getUserByEmail(
      data.email,
    );

    if (existingUser) {
      throw new BadRequestException(
        'Email already exist, please try different email address',
      );
    }

    const user: User = await this.usersService.createUser({
      ...data,
      roleId: role?.id,
    });

    // const res = await this.usersService.createAppUser({
    //   firstName: data?.first_name,
    //   lastName: data?.last_name,
    //   email: data?.email,
    //   password: data?.password,
    //   customerId: user.id,
    //   userId: '',
    //   role_id: role?.id,
    // });

    return {
      access_token: this.jwtService.sign(user),
      id: user.id,
      name: user.name,
      email: user.email,
      mgp_commission: user.mgp_commission,
      email_verified_at: user?.email_verified_at?.toDateString() || '',
      remember_token: user.remember_token,
      google_id: user.google_id,
      role: role,
      free_trial_end_date: user.free_trial_end_date,
    };
  }

  async searchCustomer(skip: any, limit: any, body: any): Promise<any> {
    return await this.usersService.searchCustomer(skip, limit, body?.searchKey);
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const user: User = await this.usersService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('user.not_found');
    }
    const token: PasswordToken = await this.tokenService.createPasswordToken({
      uuid: GenerateUUID(),
      userId: user.id,
    });
    await this.mailService.sendForgotPasswordEmail(user.email, token.id);
    return {
      message:
        'Reset password instructions sent on your email. Please check your mail',
    };
  }

  async resendEmail(tokenId: string): Promise<ForgotPasswordResponseDto> {
    const token: PasswordToken = await this.tokenService.getToken(tokenId);
    if (!token) {
      throw new BadRequestException('token.not_found');
    }
    const user: User = await this.usersService.getUserById(token.userId);
    await this.mailService.sendForgotPasswordEmail(user.email, token.id);
    return {
      message: 'Email sent successfully',
    };
  }

  async resetPassword(data: ResetPasswordRequestDto): Promise<string> {
    const token = await this.tokenService.getToken(data.token);
    if (!token) {
      throw new BadRequestException('auth.invalid_token');
    }
    if (token.isConsumed === false) {
      const user = await this.usersService.updateUserPassword(
        token,
        data.password,
      );
      await this.tokenService.changeTokenStatus(data.token);
      return user;
    } else {
      throw new HttpException(`Email Already Sent`, HttpStatus.BAD_REQUEST);
    }
  }

  private async getAppInfo(userId: string): Promise<App> {
    const userApp = await this.appsService.getAppByUserId(userId);
    if (!userApp) {
      throw new BadRequestException('App not found');
    }
    return userApp;
  }

  private async getAppInfoForAdmin(userId: string): Promise<App> {
    return await this.appsService.getAppByUserId(userId);
  }
}
