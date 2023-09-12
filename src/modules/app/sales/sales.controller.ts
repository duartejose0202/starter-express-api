import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { SalesService } from './sales.service';
import { UpdateSalesCommissionDto } from './dto/sales.dto';

@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get('commission/:id')
  async getForm(@Param('id') id: string) {
    return await this.salesService.findOne(id);
  }

  @Get('persons')
  async getSalespersons() {
    return await this.salesService.findAll();
  }

  @Post('set/commission')
  async setCommission(@Body() data: UpdateSalesCommissionDto) {
    return await this.salesService.updateCommission(data);
  }
}
