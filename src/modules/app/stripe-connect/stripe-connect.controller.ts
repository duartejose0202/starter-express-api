import { Body, Controller, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
import { StripeConnect } from '@prisma/client';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { StripeConnectResponseDto } from './dto/response/stripe-connect.response.dto';
import { StripeConnectService } from './stripe-connect.service';

@Controller('stripe-connect')
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStripeConnectStatus(@CurrentUser() user): Promise<StripeConnect> {
    const res = await this.stripeConnectService.getStripeConnection(user.id);
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async connectStripe(@CurrentUser() user): Promise<StripeConnectResponseDto> {
    return await this.stripeConnectService.connectUserToStripe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('disconnect')
  async disconnectStripeAccount(@CurrentUser() user): Promise<String> {
    return await this.stripeConnectService.disconnectStripeAccount(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify/:userId')
  async veirfyStripe(
    @Param('userId') userId: string,
  ): Promise<StripeConnectResponseDto> {
    return await this.stripeConnectService.verifyStripeStatus(userId);
  }
}
