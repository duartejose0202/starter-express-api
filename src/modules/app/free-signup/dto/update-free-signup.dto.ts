import { PartialType } from '@nestjs/mapped-types';
import { CreateFreeSignupDto } from './create-free-signup.dto';

export class UpdateFreeSignupDto extends PartialType(CreateFreeSignupDto) {}
