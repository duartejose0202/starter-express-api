import { Injectable } from '@nestjs/common';
import { genKey } from '../../../helpers/util.helper';
import DatabaseService from '../../../database/database.service';
import { GenerateUUID } from '../../../helpers/util.helper';
import { CreateFreeSignupDto } from './dto/create-free-signup.dto';
import { UpdateFreeSignupDto } from './dto/update-free-signup.dto';
@Injectable()
export class FreeSignupService {
  constructor(private _dbService: DatabaseService) {}
  async create(data: CreateFreeSignupDto, userId: string) {
    return await this._dbService.freeSignup.create({
      data: {
        id: GenerateUUID(),
        title: data.title,
        description: data.description,
        userId: userId,
        identifier: await genKey([userId, data.title].toString()),
      },
    });
  }

  async findAll(userId: string) {
    return await this._dbService.freeSignup.findMany({
      where: { userId: userId },
    });
  }

  async findOne(id: string) {
    return await this._dbService.freeSignup.findFirst({
      // @ts-ignore
      where: { identifier: id },
    });
  }

  async update(id: string, updateFreeSignupDto: UpdateFreeSignupDto) {
    return await this._dbService.freeSignup.update({
      where: { id },
      data: {
        title: updateFreeSignupDto.title,
        description: updateFreeSignupDto.description,
      },
    });
  }

  async remove(id: string) {
    return this._dbService.freeSignup.delete({ where: { id } });
  }
}
