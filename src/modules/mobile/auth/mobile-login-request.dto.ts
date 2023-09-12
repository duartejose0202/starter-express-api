import { IsEmail } from 'class-validator';

export class MobileLoginRequestDto {
  @IsEmail()
  email: string;

  password: string;
}
