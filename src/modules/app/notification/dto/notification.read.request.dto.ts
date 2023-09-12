import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NotificationReadRequestDto {
  @ApiProperty()
  @IsString()
  user_id: string;
  
  @ApiProperty()
  @IsString()
  notification_id: string;
}
