import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './current-user.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { UserType } from '../user/enums/user-type.enum';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { GoogleOauthGuard } from './guard/google-oauth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly FRONTEND_URL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService) {
    this.FRONTEND_URL = this.configService.get<string>('FRONTEND_PUBLIC_URL') || 'http://localhost:4444';
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth(@Query('redirect') redirectUrl: string) {
    // Initiates the Google OAuth2 login flow

  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Req() req, @Res() res,
                           @Query('state') state: string) {
    const auth = await this.authService.authWithGoogle(req.user)
    const redirectUrl = decodeURIComponent(state || '');

    if (auth.accessToken) {
      res.cookie('access_token', auth.accessToken, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false, // true if using HTTPS
        maxAge: 5 * 60 * 1000, // 5 minute
      });

      const finalRedirect = state
        ? `${this.FRONTEND_URL}/${redirectUrl}`
        : this.FRONTEND_URL;

      return res.redirect(finalRedirect);

    } else {
      return res.redirect(`${ this.FRONTEND_URL }/auth/login?error=google_auth_failed`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  async me(@Req() req, @CurrentUser() user: AuthUserDto) {
    return {
      user,
      accessToken: req.cookies?.access_token,
    }
  }

  @Post('logout')
  logout(@Req() req, @Res() res) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
