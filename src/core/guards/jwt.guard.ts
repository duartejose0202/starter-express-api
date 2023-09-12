import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    if (token == null || token == '') {
      return false;
    } else {
      const user = this.jwtService.decode(token.replace('Bearer ', ''));
      console.log(user);
      request.user = user;
      return true;
    }
  }
}
