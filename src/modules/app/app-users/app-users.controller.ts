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
import { CurrentUser } from 'src/core/decorators/currentUser.decorator';
import { JwtAuthGuard } from 'src/core/guards/jwt.guard';
import { AppUsersService } from './app-users.service';
import { CreateAppUserDto } from './dto/create-app-user.dto';
import { UpdateAppUserDto } from './dto/update-app-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('app-users')
export class AppUsersController {
  constructor(private readonly appUsersService: AppUsersService) {}

  @Post()
  create(@Body() createAppUserDto: CreateAppUserDto) {
    return this.appUsersService.create(createAppUserDto);
  }

  @Get('/total-users')
  getOtalCustomers() {
    return this.appUsersService.getTotalCustomers();
  }

  @Get('/sales-total-users/:id')
  getTotalSalesCustomers(@Param('id') sales_id: string) {
    return this.appUsersService.getSalesTotalCustomers(sales_id);
  }

  @Get('/all-users/:skip/:limit/:sortBy/:filter')
  GetAllCustomerInfo(
    @Param('skip') skip: any,
    @Param('limit') limit: any,
    @Param('sortBy') sortBy: any,
    @Param('filter') filter: string,
  ) {
    return this.appUsersService.getAllUsers(
      parseInt(skip),
      parseInt(limit),
      sortBy,
      filter,
    );
  }

  @Get('/sales-users/:skip/:limit/:sortBy/:sales_id')
  GetSalesCustomerInfo(
    @Param('skip') skip: any,
    @Param('limit') limit: any,
    @Param('sortBy') sortBy: any,
    @Param('sales_id') sales_id: string,
  ) {
    return this.appUsersService.getSalesUsers(
      parseInt(skip),
      parseInt(limit),
      sortBy,
      sales_id,
    );
  }

  @Get('/admin-customer/:adminId')
  GetAdminCustomerInfo(
    @Param('adminId') adminId: any,
  ) {
    return this.appUsersService.getAdminCustomer(
      adminId,
    );
  }

  @Get('/all')
  getAllCustomerInfoForUser(@CurrentUser() user) {
    return this.appUsersService.getAllCustomerInfoForUser(user.id);
  }

  @Get('/all/:id/:skip/:limit/:sortBy/:userId')
  getAllCustomersByUserId(
    @Param('id') id: any,
    @Param('skip') skip: any,
    @Param('limit') limit: any,
    @Param('sortBy') sortBy: any,
    @Param('userId') userId: any,
  ) {
    return this.appUsersService.getCustomersByAdminId(
      id,
      parseInt(skip),
      parseInt(limit),
      sortBy,
      userId
    );
  }

  @Get('/total-customers/:id/:userId')
  getTotalCustomersForAdmins(@Param('id') id: any, @Param("userId") userId: any) {
    return this.appUsersService.getTotalCustomersForAdmins(id, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appUsersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppUserDto: UpdateAppUserDto) {
    return this.appUsersService.update(+id, updateAppUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appUsersService.remove(+id);
  }

  @Delete('/delete-customer/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.appUsersService.deleteCustomer(id);
  }
}
