import { ApiProperty } from '@nestjs/swagger';

export default class CreatePasswordTokenResponseDto {
  @ApiProperty()
  token: string;
}
