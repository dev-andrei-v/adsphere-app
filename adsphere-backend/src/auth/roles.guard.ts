import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable, Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../user/enums/user-type.enum';
import { Roles, ROLES_KEY } from './roles.decorator';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    //Problem is here
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    this.logger.verbose(`Required roles: ${requiredRoles}`);
    if(!requiredRoles) {
      this.logger.verbose('No roles required, allowing access');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUserDto = request.user;

    this.logger.verbose(`User from request: ${JSON.stringify(user)}`);

    if (!user || !requiredRoles.includes(user.userType as UserType)) {
      this.logger.warn(
        `Access denied for user ${user?.id ?? 'Unknown'}, required: ${requiredRoles}`,
      );
      throw new ForbiddenException();
    }

    return true
  }


}
