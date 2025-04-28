import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const redirect = req.query['redirect'] || '';
    return {
      scope: ['email', 'profile'],
      state: encodeURIComponent(redirect)
    };
  }
}
