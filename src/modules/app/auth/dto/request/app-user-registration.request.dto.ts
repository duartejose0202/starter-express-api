import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length } from 'class-validator';

export class AppUserRegistrationRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @Length(1, 255)
  name: string;

  @ApiProperty()
  @Length(1, 255)
  firebaseUid: string;
}
