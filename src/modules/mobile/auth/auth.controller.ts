import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MobileLoginRequestDto } from './mobile-login-request.dto';
import { AuthService } from './auth.service';
import { TokenSwapDto } from './token-swap.dto';
import { CustomerTokenDto } from "./customer-token.dto";
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";

@Controller('mobile/v1/apps/:appId/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/firebaseToken')
  async getFirebaseToken(
    @Param('appId') appId: string,
    @Body() tokenDto: TokenSwapDto,
  ) {
    return await this.authService.getFirebaseToken(
      appId,
      tokenDto.token,
      tokenDto.refreshToken,
    );
  }

  @Post('/migrate')
  async migrateUser(
    @Param('appId') appId: string,
    @Body() tokenDto: TokenSwapDto,
  ) {
    return await this.authService.migrateToken(
      appId,
      tokenDto.token
    );
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/customToken')
  async getCustomToken(
    @Param('appId') appId: string,
    @Body() email: string,
  ) {
    return await this.authService.getCustomToken(
      email,
    );
  }

  @Post('/login')
  async mobileLogin(
    @Body() loginDto: MobileLoginRequestDto,
    @Param('appId') appId: string,
  ) {
    return this.authService.login(appId, loginDto.email, loginDto.password);
  }

  @Post('/signUp')
  async signUp(
    @Body() loginDto: MobileLoginRequestDto,
    @Param('appId') appId: string,
  ) {
    const result = await this.authService.signUp(appId, loginDto.email, loginDto.password);
    if (result) {
      return result;
    } else {
      throw new Error('Error creating user');
    }
  }

  @Post('/refresh')
  async mobileRefresh(
    @Body() refreshData,
    @Param('appId') appId: string,
  ) {
    try {
      return this.authService.refresh(appId, refreshData.token);
    } catch (e) {
      throw e;
    }
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/customerToken')
  async getCustomerToken(
    @Body() customerTokenDto: CustomerTokenDto,
    @Param('appId') appId: string,
  ) {
    return this.authService.getCustomerToken(appId, customerTokenDto.userEmail);
  }

  @Get('/exists')
  async userExists(
    @Query('email') email,
    @Param('appId') appId: string,
  ) {
    const exists = await this.authService.userExists(appId, email);
    return { exists };
  }
}
