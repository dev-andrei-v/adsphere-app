import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../user/schema/user.schema';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
