import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Password for the meeting if any' })
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  password?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}
