import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, Length, ValidateIf } from 'class-validator';
import { Roles } from '../../../../constants/index';

export class CreateRoleDto {
  @ApiProperty({ example: 'Admin' })
  @Length(1, 55)
  name: string;

  @ApiProperty({ example: 'Full' })
  @Length(1, 55)
  access_level: string;
}
