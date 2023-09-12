import { IsEmail } from "class-validator";

export class CustomerTokenDto {
  @IsEmail()
  userEmail: string;
}
