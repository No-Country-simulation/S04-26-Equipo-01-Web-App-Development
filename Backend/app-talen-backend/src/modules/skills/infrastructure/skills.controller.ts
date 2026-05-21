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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Habilidades')
@ApiBearerAuth()
@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Listar mis habilidades',
    description:
      'Devuelve todas las habilidades registradas por el usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de habilidades.',
    type: [UserSkill],
  })
  findMine(@Req() request: AuthenticatedRequest): Promise<UserSkill[]> {
    return this.skillsService.findMine(request.user);
  }

  @Post('me')
  @ApiOperation({
    summary: 'Agregar habilidad',
    description: 'Permite agregar una nueva habilidad al perfil del usuario.',
  })
  @ApiBody({
    type: CreateUserSkillDto,
    description: 'Datos de la habilidad a agregar.',
  })
  @ApiResponse({
    status: 201,
    description: 'Habilidad agregada.',
    type: UserSkill,
  })
  createMine(
    @Req() request: AuthenticatedRequest,
    @Body() createUserSkillDto: CreateUserSkillDto,
  ): Promise<UserSkill> {
    return this.skillsService.createMine(request.user, createUserSkillDto);
  }

  @Patch('me/:skillId')
  @ApiOperation({
    summary: 'Actualizar habilidad',
    description: 'Permite modificar una habilidad específica del usuario.',
  })
  @ApiParam({
    name: 'skillId',
    description: 'ID de la habilidad a actualizar.',
  })
  @ApiBody({
    type: UpdateUserSkillDto,
    description: 'Datos a actualizar en la habilidad.',
  })
  @ApiResponse({
    status: 200,
    description: 'Habilidad actualizada.',
    type: UserSkill,
  })
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
