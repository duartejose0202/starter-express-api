import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { CircuitsService } from './circuits.service';
import { CircuitDocument } from './circuit.document';

@Controller('mobile/v1/apps/:appId/circuits')
export class CircuitsController {
  constructor(private readonly circuitsService: CircuitsService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('')
  async getCircuits(
    @Param('appId') appId: string,
    @Query('ids') ids?: string[],
  ): Promise<CircuitDocument[]> {
    if (ids != null && ids.length > 0) {
      return await this.circuitsService.getCircuitsByIds(appId, ids);
    }
    return await this.circuitsService.getAllCircuits(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('')
  async createCircuit(
    @Param('appId') appId: string,
    @Body() circuit: CircuitDocument,
  ): Promise<CircuitDocument> {
    try {
      return await this.circuitsService.createCircuit(appId, circuit);
    } catch (e) {
      throw new InternalServerErrorException('Failed to create circuit');
    }
  }
}
