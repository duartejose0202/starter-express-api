import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, Length, ValidateIf } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf(
    (obj) => obj.providerId === undefined && obj.providerType === undefined,
  )
  @Length(6, 128)
  password: string;
}
