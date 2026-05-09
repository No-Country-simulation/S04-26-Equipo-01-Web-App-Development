import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

export interface ValidatedLinkedInUser {
  email: string;
  firstName: string;
  providerId: string;
  accessToken: string;
}

interface LinkedInUserInfoResponse {
  email: string;
  given_name: string;
  family_name?: string;
  sub: string;
  picture?: string;
}

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private configService: ConfigService) {
    super({
      authorizationURL: configService.get<string>(
        'LINKEDIN_AUTHORIZATION_URL',
      )!,
      tokenURL: configService.get<string>('LINKEDIN_TOKEN_URL')!,
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID')!,
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('LINKEDIN_CALLBACK_URL')!,
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (
      err: Error | null,
      user: ValidatedLinkedInUser | false,
      info?: unknown,
    ) => void,
  ): Promise<ValidatedLinkedInUser> {
    try {
      const response = await fetch(
        this.configService.get<string>('LINKEDIN_USERINFO_URL')!,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user profile from LinkedIn');
      }

      const data = (await response.json()) as LinkedInUserInfoResponse;

      const user: ValidatedLinkedInUser = {
        email: data.email,
        firstName: data.given_name,
        providerId: data.sub,
        accessToken,
      };

      done(null, user);
      return user;
    } catch (error) {
      done(error as Error, false);
      throw error;
    }
  }
}
