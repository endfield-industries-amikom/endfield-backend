export class JwtDto {
  sub: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
