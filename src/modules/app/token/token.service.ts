import { Injectable } from '@nestjs/common';
import { PasswordToken } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import CreatePasswordTokenRequestDto from './dto/request/create.request';

@Injectable()
export default class TokenService {
  constructor(private _dbService: DatabaseService) {}

  async createPasswordToken(
    data: CreatePasswordTokenRequestDto,
  ): Promise<PasswordToken> {
    const token = await this._dbService.passwordToken.create({
      data: {
        id: data.uuid,
        isConsumed: false,
        userId: data.userId,
      },
    });
    return token;
  }

  async getToken(tokenId: string): Promise<PasswordToken> {
    const token = await this._dbService.passwordToken.findFirst({
      where: {
        id: tokenId,
      },
    });
    return token;
  }
  async changeTokenStatus(tokenId: string): Promise<PasswordToken> {
    const token = await this._dbService.passwordToken.update({
      where: { id: tokenId },
      data: { isConsumed: true },
    });
    return token;
  }
}
