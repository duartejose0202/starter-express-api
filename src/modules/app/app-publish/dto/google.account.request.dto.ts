import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleAccountRequestDto {
  @ApiProperty()
  @IsString()
  gplk: string;

  @ApiProperty()
  @IsString()
  jsonKey: string;

  @ApiProperty()
  @IsString()
  userId: string;
}
