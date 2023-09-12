import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export default class CreatePasswordTokenRequestDto {
  @ApiProperty()
  @IsUUID('4')
  uuid: string;

  @ApiProperty()
  @IsUUID()
  userId: string;
}
