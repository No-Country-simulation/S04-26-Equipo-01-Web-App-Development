import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { CreateProfileDto } from '../application/dto/create-profile.dto';
import { UpdateInterestedRolesDto } from '../application/dto/update-interested-roles.dto';
import { UpdateProfileDto } from '../application/dto/update-profile.dto';
import { UpdateWorkPreferencesDto } from '../application/dto/update-work-preferences.dto';
import { ProfilesService } from '../application/profiles.service';
import { Profile } from './entities/profile.entity';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('me')
  createMe(
    @Req() request: AuthenticatedRequest,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.createMe(request.user, createProfileDto);
  }

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest): Promise<Profile> {
    return this.profilesService.getMe(request.user);
  }

  @Patch('me')
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.updateMe(request.user, updateProfileDto);
  }

  @Patch('me/preferences')
  updateMyWorkPreferences(
    @Req() request: AuthenticatedRequest,
    @Body() updateWorkPreferencesDto: UpdateWorkPreferencesDto,
  ): Promise<Profile> {
    return this.profilesService.updateMyWorkPreferences(
      request.user,
      updateWorkPreferencesDto,
    );
  }

  @Patch('me/interested-roles')
  updateMyInterestedRoles(
    @Req() request: AuthenticatedRequest,
    @Body() updateInterestedRolesDto: UpdateInterestedRolesDto,
  ): Promise<Profile> {
    return this.profilesService.updateMyInterestedRoles(
      request.user,
      updateInterestedRolesDto,
    );
  }

  @Patch('me/employability-score')
  recalculateMyEmployabilityScore(
    @Req() request: AuthenticatedRequest,
  ): Promise<Profile> {
    return this.profilesService.recalculateMyEmployabilityScore(request.user);
  }
}
