import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NotificationRequestDto {
  @ApiProperty()
  @IsString()
  title: string;
  
  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  category: string;
}
