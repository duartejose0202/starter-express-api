import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, Length, ValidateIf } from 'class-validator';
import { Roles } from '../../../../../constants';

export class SignupRequestDto {
  @ApiProperty({ example: 'test@test.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'goodPassword' })
  @IsOptional()
  @ValidateIf(
    (obj) => obj.providerId === undefined && obj.providerType === undefined,
  )
  @Length(6, 128)
  password: string;

  @ApiProperty({ example: 'admininistrator' })
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: 'admininistrator' })
  @Length(1, 100)
  first_name: string;

  @ApiProperty({ example: 'admininistrator' })
  @Length(1, 100)
  last_name: string;

  @ApiProperty({ example: 'admininistrator' })
  @Length(1, 50)
  phone_number: string;

  @IsIn([Roles.ADMIN, Roles.APP_OWNER, Roles.APP_USER, Roles.SUPER_ADMIN])
  @ApiProperty({ example: 'Admin' })
  role: Roles;
}
