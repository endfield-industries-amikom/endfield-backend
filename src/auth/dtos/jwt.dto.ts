export class JwtDto {
  user: {
    sub: string;
    username: string;
    role: string;
    iat: number;
    exp: number;
  };
}
