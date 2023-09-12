import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { SplitPaymentsService } from './split-payments.service';
import { CreateSplitPaymentsDto } from './dto/create-split-payments.dto';

@UseGuards(JwtAuthGuard)
@Controller('split')
export class SplitPaymentsController {
  constructor(
    private stripeService: StripeService,
    private splitService: SplitPaymentsService,
  ) {}

  @Get('all/:id')
  async findAllSplits(@Param('id') id: string) {
    return await this.splitService.getSplits(id);
  }

  @Get('apps/all')
  async findAllApps() {
    return await this.splitService.getAllApps();
  }

  @Get('accounts')
  async findAllAccounts() {
    return await this.splitService.findAllAccounts();
  }

  @Post('add')
  async add(@Body() data: CreateSplitPaymentsDto) {
    return await this.splitService.addSplit(data);
  }

  @Post('add-customer')
  async addCustomer(@Body() data: any) {
    return await this.splitService.addCustomerAndSplit(data);
  }

  @Post('update/app/:id')
  async updateAppSplit(
    @Param('id') id: string,
    @Body() data: CreateSplitPaymentsDto,
  ) {
    return this.splitService.updateAppSplit(id, data);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() data: CreateSplitPaymentsDto) {
    return this.splitService.updateSplit(id, data);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.splitService.deleteSplit(id);
  }
}
