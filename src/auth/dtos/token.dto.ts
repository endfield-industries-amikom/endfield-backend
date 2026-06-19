import { IsString } from 'class-validator';
import { UserDto } from './user.dto';

export class TokenDto {
  @IsString()
  access_token: string;
  user: UserDto;
}
