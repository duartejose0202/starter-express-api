import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'some token here' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'goodPassword' })
  @IsString()
  password: string;
}
