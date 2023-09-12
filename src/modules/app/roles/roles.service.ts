import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import { GenerateUUID, HashPassword } from '../../../helpers/util.helper';
import { CreateRoleDto } from '../app-users/dto/create-role-dto';

@Injectable()
export class RolesService {
  constructor(private _dbService: DatabaseService) {}

  async getRoleByName(name: string): Promise<Role> {
    const role = await this._dbService.role.findFirst({
      where: { name: name },
    });
    return role;
  }

  async addRole(body: CreateRoleDto): Promise<Role> {
    const role = await this._dbService.role.findFirst({
      where: { name: body?.name },
    });

    if (role) {
      throw new BadRequestException('Role name already exists');
    }

    const roleInfo = this._dbService.role.create({
      data: {
        id: GenerateUUID(),
        name: body?.name,
        access_level: body?.access_level,
      },
    });

    return roleInfo;
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this._dbService.role.findFirst({
      where: { id: id },
    });
    return role;
  }
}
