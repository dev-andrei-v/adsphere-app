import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { UserAuthProvider } from '../user/enums/user-auth-provider.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(registerDto: RegisterDto) {
    this.logger.log("New user registration attempt", registerDto.email);
    const newUser = await this.userService.createUser(registerDto);
    if (!newUser) {
      throw new Error('User registration failed');
    }
    const response: RegisterResponseDto = {
      userId: newUser._id?.toString() ?? '',
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
    };
    return { message: 'Success' }
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`User login attempt: ${loginDto.email}`);
    const user = await this.userService.findUserByEmail(loginDto.email);
    if (
      user &&
      (await this.userService.comparePassword(loginDto.password, user.password))
    ) {
      const payload: JwtPayload = {
        id: user._id!!.toString(),
        email: user.email,
        userType: user.type,
      };
      await this.updateLastLogin(user._id!!.toString());
      const accessToken = this.jwtService.sign(payload);
      return { message: 'Success', accessToken };
    }

    throw new UnauthorizedException('Invalid login credentials');
  }

  async authWithGoogle(userData: GoogleAuthDto) {
    this.logger.log(`Google authentication attempt: ${userData.email}`);
    const user = await this.userService.findUserByEmail(userData.email, UserAuthProvider.GOOGLE);
    this.logger.log(`User found: ${user ? user.email : 'No user found'}`);
    if (user) {
      if (user.authProvider !== UserAuthProvider.GOOGLE) {
        throw new UnauthorizedException('User registered with different provider');
      }
      const payload: JwtPayload = {
        id: user._id!!.toString(),
        email: user.email,
        userType: user.type,
      };
      this.logger.log(`User authenticated successfully: ${user.email}`);
      this.logger.log(`Payload: ${JSON.stringify(payload)}`);
      const accessToken = this.jwtService.sign(payload);
      await this.updateLastLogin(user._id!!.toString());
      this.logger.log(`Access token generated for user: ${user.email} - ${accessToken}`);
      return { message: 'Success', accessToken };
    } else {
      const newGoogleUser = await this.userService.createUserFromProvider(
        userData,
        UserAuthProvider.GOOGLE,
      );
      this.logger.log(`New Google user created: ${newGoogleUser.email}`);
      if (!newGoogleUser) {
        throw new Error('User registration failed');
      }
      const payload: JwtPayload = {
        id: newGoogleUser._id!!.toString(),
        email: newGoogleUser.email,
        userType: newGoogleUser.type,
      };
      await this.updateLastLogin(newGoogleUser._id!!.toString());
      const accessToken = this.jwtService.sign(payload);

      return { message: 'Success', accessToken };
    }
  }

  async updateLastLogin(userId: string) {
    this.logger.log(`Updating last login for user: ${userId}`);
    const user = await this.userService.findUserById(userId);
    if(!user) return;
    user.lastLoginAt = new Date();
    await user.save();
    this.logger.log(`Last login updated for user: ${user.email} ${user.lastLoginAt}`);
  }
}
