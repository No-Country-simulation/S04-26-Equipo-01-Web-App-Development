import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-linkedin-oauth2';
import { VerifyCallback } from 'passport-oauth2';
import { Profile } from 'passport';

export interface LinkedInProfile extends Profile {
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    picture: string;
    sub: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID')!,
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('LINKEDIN_CALLBACK_URL')!,
      scope: ['openid', 'profile', 'email'],
      state: true,
    } as any);

    (this as any).userProfile = async (accessToken: string, done: any) => {
      try {
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          return done(new Error(`Error de LinkedIn (${response.status}): ${errorData}`));
        }

        const json = await response.json();
        
        const profile = {
          provider: 'linkedin',
          id: json.sub,
          _json: json, 
        };
        
        done(null, profile);
      } catch (error) {
        done(error);
      }
    };
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: LinkedInProfile,
    done: VerifyCallback,
  ) {
    const { given_name, family_name, email, picture } = profile._json;

    const user = {
      email,
      firstName: given_name,
      lastName: family_name,
      picture,
      accessToken,
    };

    done(null, user);
  }
}
