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
import { SkillLevel } from '../domain/skill-level.enum';
import { UserSkill } from './entities/user-skill.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const createUserSkillRequestExample = {
  name: 'TypeScript',
  category: 'technical',
  level: SkillLevel.MEDIUM,
  evidence: 'https://github.com/usuario/proyecto-typescript',
  source: 'curso-online',
};

const updateUserSkillRequestExample = {
  level: SkillLevel.ADVANCED,
  evidence: 'https://www.credly.com/badges/typescript',
  source: 'bootcamp',
};

const userSkillResponseExample = {
  id: '605d2455-fdc0-4fbe-a20e-1292f6e69928',
  profileId: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  skillId: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  level: SkillLevel.ADVANCED,
  evidence: 'https://www.credly.com/badges/typescript',
  source: 'bootcamp',
  skill: {
    id: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
    name: 'typescript',
    category: 'technical',
  },
};

const unauthorizedExample = {
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized',
};

const forbiddenExample = {
  statusCode: 403,
  message: 'Only TALENT users can manage skills',
  error: 'Forbidden',
};

const notFoundExample = {
  statusCode: 404,
  message: 'Skill not found for this user',
  error: 'Not Found',
};

const badRequestExample = {
  statusCode: 400,
  message: ['level must be one of: INITIAL, MEDIUM, ADVANCED'],
  error: 'Bad Request',
};

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
    schema: {
      example: [userSkillResponseExample],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
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
    schema: {
      example: createUserSkillRequestExample,
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Habilidad agregada.',
    type: UserSkill,
    schema: {
      example: userSkillResponseExample,
    },
  })
  @ApiBadRequestResponse({
    description: 'Error de validacion del body.',
    example: badRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
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
    description: 'UUID de la habilidad a actualizar.',
    example: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  })
  @ApiBody({
    type: UpdateUserSkillDto,
    description: 'Datos a actualizar en la habilidad.',
    schema: {
      example: updateUserSkillRequestExample,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Habilidad actualizada.',
    type: UserSkill,
    schema: {
      example: userSkillResponseExample,
    },
  })
  @ApiBadRequestResponse({
    description: 'Error de validacion del body.',
    example: badRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
  })
  @ApiNotFoundResponse({
    description:
      'No se encontro la habilidad solicitada para el usuario autenticado.',
    example: notFoundExample,
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
