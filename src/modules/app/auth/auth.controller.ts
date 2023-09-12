import { Body, Controller, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { ForgotPasswordRequestDto } from './dto/request/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request';
import { Patch } from '@nestjs/common/decorators';
import { AppDataService } from "../../mobile/app_data/app-data.service";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appService: AppDataService,
  ) {}

  @Post('app/update')
  updateApp(@Body() data: any) {
    return this.authService.appUpdate(data);
  }

  @Post('app/template')
  async applyTemplateToApp(@Body() data: any) {
    const appInfo = await this.appService.getAppById(data.firebaseAppId);
    await this.appService.copyApp(data.templateId, appInfo, data.firebaseAppId);
  }

  @Post('app/double-check')
  checkByAppName(@Body() data: { userId: string; appName: string }) {
    return this.authService.checkByAppName(data.userId, data.appName);
  }

  @Post('app/search/:skip/:limit/')
  searchCustomers(@Body() searchKey: any, @Param('skip') skip: any, @Param('limit') limit: any) {
    return this.authService.searchCustomer(parseInt(skip), parseInt(limit), searchKey);
  }

  @Post('app/create-customer')
  createNewCustomer(@Body() newAppUser: any) {
    return this.authService.createCustomer(newAppUser);
  }

  @Patch('app/edit-customer/:id')
  editCustomer(@Body() userInfo: any, @Param('id') id: string) {
    return this.authService.editCustomer(userInfo, id);
  }

  @Post('dashboard/login')
  async dashboardLogin(@Body() loginDto: LoginRequestDto) {
    return this.authService.dashboardLogin(loginDto.email, loginDto.password);
  }

  @Post('dashboard/social-login')
  async socialLogin(@Body() data: any) {
    return this.authService.socialLogin(data);
  }

  @Post('admin-dashboard/login')
  async loginToAdminAccount(@Body() loginDto: any) {
    return this.authService.loginToAdminAccount(loginDto.email);
  }

  @Post('sales/register')
  createNewSalesperson(@Body() newAppUser: any) {
    return this.authService.salesRegister(newAppUser);
  }

  @Post('sales/login')
  async salespersonLogin(@Body() loginDto: LoginRequestDto) {
    return this.authService.dashboardLogin(loginDto.email, loginDto.password);
  }

  @Post('dashboard/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordRequestDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('dashboard/resend-pasword-email/:id')
  async resendEmail(@Param('id') id: string) {
    return this.authService.resendEmail(id);
  }

  @Post('dashboard/reset-password')
  async resetPassword(@Body() body: ResetPasswordRequestDto) {
    return this.authService.resetPassword(body);
  }

  @Post('owner/signup')
  ownerSignup(@Body() user: any) {
    return this.authService.ownerSignup(user);
  }

  @Post('owner/update')
  ownerUpdate(@Body() user: any) {
    return this.authService.ownerUpdate(user);
  }

  @Post('owner/get-code')
  ownerGetCode(@Body() data: any) {
    return this.authService.ownerGetCode(data.phone_number);
  }

  @Post('owner/verify-code')
  ownerVerifyCode(@Body() data: any) {
    return this.authService.ownerVerifyCode(data.phone_number, data.code);
  }
}
