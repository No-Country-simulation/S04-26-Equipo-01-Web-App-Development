import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { CreateUserSkillDto } from '../application/dto/create-user-skill.dto';
import { UpdateUserSkillDto } from '../application/dto/update-user-skill.dto';
import { SkillsService } from '../application/skills.service';
import { UserSkill } from './entities/user-skill.entity';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('me')
  findMine(@Req() request: AuthenticatedRequest): Promise<UserSkill[]> {
    return this.skillsService.findMine(request.user);
  }

  @Post('me')
  createMine(
    @Req() request: AuthenticatedRequest,
    @Body() createUserSkillDto: CreateUserSkillDto,
  ): Promise<UserSkill> {
    return this.skillsService.createMine(request.user, createUserSkillDto);
  }

  @Patch('me/:skillId')
  updateMine(
    @Req() request: AuthenticatedRequest,
    @Param('skillId') skillId: string,
    @Body() updateUserSkillDto: UpdateUserSkillDto,
  ): Promise<UserSkill> {
    return this.skillsService.updateMine(
      request.user,
      skillId,
      updateUserSkillDto,
    );
  }
}
