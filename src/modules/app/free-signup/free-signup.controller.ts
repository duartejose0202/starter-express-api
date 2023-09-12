import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FreeSignupService } from './free-signup.service';
import { CreateFreeSignupDto } from './dto/create-free-signup.dto';
import { UpdateFreeSignupDto } from './dto/update-free-signup.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';

@UseGuards(JwtAuthGuard)
@Controller('free-signup')
export class FreeSignupController {
  constructor(private readonly freeSignupService: FreeSignupService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createFreeSignupDto: CreateFreeSignupDto,
  ) {
    return this.freeSignupService.create(createFreeSignupDto, user.id);
  }

  @Get('all')
  findAll(@CurrentUser() user: any) {
    return this.freeSignupService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.freeSignupService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFreeSignupDto: UpdateFreeSignupDto,
  ) {
    return this.freeSignupService.update(id, updateFreeSignupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.freeSignupService.remove(id);
  }
}
