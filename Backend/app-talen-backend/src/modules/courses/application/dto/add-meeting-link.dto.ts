import {
  IsDateString,
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { MeetingPlatform } from '../../domain/meeting-platform.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMeetingLinkDto {
  @ApiProperty({
    description: 'Meeting URL (Google Meet, Zoom, etc.)',
    example: 'https://meet.google.com/xxx-xxxx-xxx',
  })
  @IsUrl(
    {},
    {
      message:
        'url must be a valid URL (e.g., https://meet.google.com/... or https://zoom.us/...)',
    },
  )
  url!: string;

  @ApiProperty({
    description: 'Platform of the meeting link',
    enum: MeetingPlatform,
  })
  @IsEnum(MeetingPlatform, {
    message: 'platform must be one of: GOOGLE_MEET, ZOOM, TEAMS, OTHER',
  })
  platform!: MeetingPlatform;

  @ApiProperty({
    description: 'Scheduled date and time of the workshop in ISO 8601 format',
    example: '2026-06-15T19:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'scheduledAt must be a valid ISO 8601 datetime' },
  )
  scheduledAt!: string;

  @ApiPropertyOptional({ description: 'Password for the meeting if any' })
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  password?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}
