import { IsString } from 'class-validator';
import { UserDto } from 'src/users/dtos';

export class TokenDto {
  @IsString()
  access_token: string;
  user: UserDto;
}
