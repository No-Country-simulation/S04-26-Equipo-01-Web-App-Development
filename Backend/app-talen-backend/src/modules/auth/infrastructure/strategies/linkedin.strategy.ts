import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { ExternalProfileDto } from '../../application/dto/external-profile.dto';

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
    const callbackURL =
      configService.get<string>('LINKEDIN_CALLBACK_URL') ||
      'http://localhost:3000/auth/linkedin/callback';

    super({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID')!,
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET')!,
      callbackURL,
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (
      err: Error | null,
      user: ExternalProfileDto | false,
      info?: unknown,
    ) => void,
  ): Promise<ExternalProfileDto> {
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

      const user: ExternalProfileDto = {
        email: data.email,
        firstName: data.given_name,
        lastName: data.family_name || '',
        providerId: data.sub,
        picture: data.picture,
      };

      done(null, user);
      return user;
    } catch (error) {
      done(error as Error, false);
      throw error;
    }
  }
}
