import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { MarketplaceService } from '../domain/marketplace.service';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { CreateVacancyDto } from '../application/dto/create-vacancy.dto';
import { CreateRecruiterSkillDto } from '../application/dto/create-recruiter-skill.dto';

@ApiTags('Recruiter')
@ApiBearerAuth()
@Controller('recruiter')
@UseGuards(JwtAuthGuard)
export class RecruiterController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('skills')
  @ApiOperation({
    summary: 'Listar skills disponibles',
    description:
      'Retorna el catalogo de skills disponibles en base de datos para usar en vacantes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Skills obtenidas exitosamente.',
    isArray: true,
  })
  async getAvailableSkills() {
    return this.marketplaceService.getAvailableSkills();
  }

  @Post('skills')
  @ApiOperation({
    summary: 'Crear skill para vacantes',
    description:
      'Crea una nueva skill en el catalogo para que quede disponible en formularios de vacantes.',
  })
  @ApiBody({
    type: CreateRecruiterSkillDto,
    description: 'Datos de la skill a crear.',
  })
  @ApiResponse({
    status: 201,
    description: 'Skill creada exitosamente.',
  })
  async createRecruiterSkill(
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateRecruiterSkillDto,
  ) {
    return this.marketplaceService.createRecruiterSkill(
      request.user.userId,
      payload,
    );
  }

  @Post('vacancies')
  @ApiOperation({
    summary: 'Crear vacante',
    description:
      'Crea una nueva vacante para la empresa asociada al usuario autenticado.',
  })
  @ApiBody({
    type: CreateVacancyDto,
    description: 'Datos de la vacante a publicar.',
  })
  @ApiResponse({
    status: 201,
    description: 'Vacante creada exitosamente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo usuarios empresa pueden crear vacantes.',
  })
  async createVacancy(
    @Req() request: AuthenticatedRequest,
    @Body() createVacancyDto: CreateVacancyDto,
  ) {
    return this.marketplaceService.createVacancy(
      request.user.userId,
      createVacancyDto,
    );
  }

  @Get('vacancies')
  @ApiOperation({
    summary: 'Listar vacantes creadas',
    description:
      'Retorna las vacantes creadas por la empresa asociada al usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vacantes obtenidas exitosamente.',
    isArray: true,
  })
  async getMyVacancies(@Req() request: AuthenticatedRequest) {
    return this.marketplaceService.getMyVacancies(request.user.userId);
  }

  @Get('vacancies/:vacancyId/pipeline')
  @ApiOperation({
    summary: 'Obtener pipeline de una vacante',
    description:
      'Retorna candidatos agrupados por etapa: preseleccionados, seleccionados, finalistas y aceptados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pipeline obtenido correctamente.',
  })
  async getVacancyPipeline(
    @Req() request: AuthenticatedRequest,
    @Param('vacancyId') vacancyId: string,
  ) {
    return this.marketplaceService.getVacancyPipeline(
      request.user.userId,
      vacancyId,
    );
  }

  @Post('vacancies/:vacancyId/candidates/:candidateId/select')
  @ApiOperation({
    summary: 'Mover candidato a seleccionado',
    description:
      'Cambia el estado del candidato dentro de la vacante a seleccionado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidato movido a seleccionado.',
  })
  async moveCandidateToSelected(
    @Req() request: AuthenticatedRequest,
    @Param('vacancyId') vacancyId: string,
    @Param('candidateId') candidateId: string,
  ) {
    return this.marketplaceService.moveCandidateToPipelineStage(
      request.user.userId,
      vacancyId,
      candidateId,
      'SELECTED',
    );
  }

  @Post('vacancies/:vacancyId/candidates/:candidateId/finalist')
  @ApiOperation({
    summary: 'Mover candidato a finalista',
    description:
      'Cambia el estado del candidato dentro de la vacante a finalista.',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidato movido a finalista.',
  })
  async moveCandidateToFinalist(
    @Req() request: AuthenticatedRequest,
    @Param('vacancyId') vacancyId: string,
    @Param('candidateId') candidateId: string,
  ) {
    return this.marketplaceService.moveCandidateToPipelineStage(
      request.user.userId,
      vacancyId,
      candidateId,
      'FINALIST',
    );
  }

  @Post('vacancies/:vacancyId/candidates/:candidateId/accept')
  @ApiOperation({
    summary: 'Aceptar candidato finalista',
    description:
      'Marca al candidato finalista como aceptado/reservado, respetando el limite de vacantes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidato aceptado.',
  })
  async acceptFinalistCandidate(
    @Req() request: AuthenticatedRequest,
    @Param('vacancyId') vacancyId: string,
    @Param('candidateId') candidateId: string,
  ) {
    return this.marketplaceService.moveCandidateToPipelineStage(
      request.user.userId,
      vacancyId,
      candidateId,
      'ACCEPTED',
    );
  }

  @Get('candidates')
  @ApiOperation({
    summary: 'Obtener lista de candidatos',
    description:
      'Retorna lista de candidatos (talentos) que el reclutador puede ver con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de candidatos obtenida exitosamente',
    type: Profile,
    isArray: true,
  })
  async getCandidates(
    @Query('name') name?: string,
    @Query('title') title?: string,
    @Query('skill') skill?: string,
    @Query('minScore') minScore?: number,
    @Query('status') status?: string,
  ) {
    return this.marketplaceService.getCandidates({
      name,
      title,
      skill,
      minScore,
      status,
    });
  }

  @Get('candidates/:candidateId')
  @ApiOperation({
    summary: 'Obtener detalles de candidato',
    description: 'Retorna información completa de un candidato específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidato encontrado',
    type: Profile,
  })
  @ApiResponse({
    status: 404,
    description: 'Candidato no encontrado',
  })
  async getCandidateDetails(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateDetails(candidateId);
  }

  @Get('candidates/:candidateId/skills')
  @ApiOperation({
    summary: 'Obtener skills de candidato',
    description: 'Retorna todas las skills validadas del candidato',
  })
  @ApiResponse({
    status: 200,
    description: 'Skills obtenidas',
    isArray: true,
  })
  async getCandidateSkills(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateSkills(candidateId);
  }

  @Get('candidates/:candidateId/cv')
  @ApiOperation({
    summary: 'Obtener CV de candidato',
    description: 'Retorna información del CV del candidato',
  })
  @ApiResponse({
    status: 200,
    description: 'CV obtenido',
  })
  @ApiResponse({
    status: 404,
    description: 'CV no encontrado',
  })
  async getCandidateCv(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateCv(candidateId);
  }

  @Get('candidates/:candidateId/assessment-results')
  @ApiOperation({
    summary: 'Obtener resultados de evaluaciones',
    description:
      'Retorna resultados de pruebas técnicas y psicotécnicas del candidato',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados obtenidos',
    isArray: true,
  })
  async getCandidateAssessmentResults(
    @Param('candidateId') candidateId: string,
  ) {
    return this.marketplaceService.getCandidateAssessmentResults(candidateId);
  }

  @Get('candidates/:candidateId/learning-path')
  @ApiOperation({
    summary: 'Obtener ruta de aprendizaje',
    description: 'Retorna información de la ruta de aprendizaje del candidato',
  })
  @ApiResponse({
    status: 200,
    description: 'Ruta de aprendizaje obtenida',
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta de aprendizaje no encontrada',
  })
  async getCandidateLearningPath(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateLearningPath(candidateId);
  }

  @Get('candidates/:candidateId/courses')
  @ApiOperation({
    summary: 'Obtener cursos del candidato',
    description: 'Retorna lista de cursos realizados, en progreso o pendientes',
  })
  @ApiResponse({
    status: 200,
    description: 'Cursos obtenidos',
    isArray: true,
  })
  async getCandidateCourses(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateCourses(candidateId);
  }

  @Get('candidates/:candidateId/consolidated')
  @ApiOperation({
    summary: 'Obtener datos consolidados del candidato',
    description:
      'Retorna en un solo payload perfil, skills, CV, resultados, learning path y cursos del candidato.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos consolidados obtenidos',
  })
  async getCandidateConsolidatedData(
    @Param('candidateId') candidateId: string,
  ) {
    return this.marketplaceService.getCandidateConsolidatedData(candidateId);
  }
}
