import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { GoogleAuthDto } from '../dto/google-auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(PassportStrategy.name);
 constructor(readonly configService: ConfigService) {
   const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
   const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
   const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

  super({
    clientID: clientID || "",
    clientSecret: clientSecret || "",
    callbackURL: callbackURL || "",
    scope: ['profile', 'email']
  })
   this.logger.verbose(`Google Strategy initialized with clientID: ${clientID}`);
 }
 async validate(
   accesToken: string,
    refreshToken: string,
   profile: any,
   done: VerifyCallback
 ): Promise<any> {
   const { id, name, emails, photos } = profile;
   const user: GoogleAuthDto = {
      providerId: id,
      name: `${name?.givenName} ${name?.familyName}`,
      email: emails[0].value,
      // picture: photos[0].value,
   };

   done(null, user);
 }

}
