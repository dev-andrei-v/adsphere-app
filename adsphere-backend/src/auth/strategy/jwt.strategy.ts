import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { JwtPayload } from '../jwt-payload.interface';
import { AuthUserDto } from '../dto/auth-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    readonly configService: ConfigService,
    private readonly userService: UserService) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'UNDEFINED_JWT_SECRET';
    super({
      secretOrKey: jwtSecret,
      jwtFromRequest: ExtractJwt.fromExtractors(
        [
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          (req) => {
            return req?.cookies?.access_token || null;
          }
        ]
      )
    });
    this.logger.verbose("JwtStrategy initialized ✅");
  }

  async validate(payload: JwtPayload): Promise<AuthUserDto> {
    const { id } = payload;
    this.logger.verbose(`Payload: ${JSON.stringify(payload)}`);
    const user = await this.userService.findUserById(id);
    if (!user) {
      throw new UnauthorizedException();
    }

    this.logger.verbose(`User found: ${JSON.stringify(user)}`);
    return {
      id: user.id,
      email: user.email,
      userType: user.type,
    };
  }
}
