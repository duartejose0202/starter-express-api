import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AppleAccountRequestDto {
  @ApiProperty()
  @IsString()
  teamId: string;

  @ApiProperty()
  @IsString()
  teamName: string;

  @ApiProperty()
  @IsString()
  bundleId: string;

  @ApiProperty()
  @IsString()
  iosKeyId: string;

  @ApiProperty()
  @IsString()
  iosSecret: string;

  @ApiProperty()
  @IsString()
  iapKeyId: string;

  @ApiProperty()
  @IsString()
  iapKey: string;

  @ApiProperty()
  @IsString()
  apiKeyId: string;

  @ApiProperty()
  @IsString()
  apiKeyIssuerId: string;

  @ApiProperty()
  @IsString()
  apiKey: string;

  @ApiProperty()
  @IsString()
  userId: string;
}
