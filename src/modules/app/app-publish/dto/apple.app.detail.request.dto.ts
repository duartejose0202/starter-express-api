import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AppleAppDetailRequestDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  iconFile: string;

  @ApiProperty()
  @IsString()
  iconUrl: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  promotion: string;

  @ApiProperty()
  @IsString()
  subtitle: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  keywords: string;

  @ApiProperty()
  @IsString()
  supportUrl: string;

  @ApiProperty()
  @IsString()
  marketingUrl?: string;

  @ApiProperty()
  @IsString()
  privacyPolicyUrl: string;

  @ApiProperty()
  screenshotFiles?: string[];

  @ApiProperty()
  screenshotUrls?: string[];

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  status: string;
}
