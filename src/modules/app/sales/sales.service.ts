import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { UpdateSalesCommissionDto } from './dto/sales.dto';

@Injectable()
export class SalesService {
  constructor(private _dbService: DatabaseService) {}

  async findOne(id: string) {
    try {
      return await this._dbService.commissions.findFirst({
        where: {
          identifier: id,
        },
      });
    } catch (error) {
      throw new Error('Referral not found');
    }
  }

  async findAll() {
    try {
      const commissions = await this._dbService.commissions.findMany({
        include: {
          User: {
            include: {
              StripeConnect: true,
            },
          },
        },
      });

      const users = commissions.filter(
        (user) => user.User?.deleted_at === null,
      );
      return users;
    } catch (error) {
      throw new Error('Error loading all salespersons');
    }
  }

  async updateCommission(data: UpdateSalesCommissionDto) {
    try {
      return await this._dbService.commissions.update({
        where: {
          id: data.salesperson_id,
        },
        data: {
          first_commission: data.first_commission,
          second_commission: data.second_commission,
        },
      });
    } catch (error) {
      throw new Error('Failed at updating commission');
    }
  }
}
