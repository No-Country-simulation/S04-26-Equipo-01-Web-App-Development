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
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID')!,
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET')!,
      callbackURL: 'http://localhost:3000/auth/linkedin/callback',
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
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

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
