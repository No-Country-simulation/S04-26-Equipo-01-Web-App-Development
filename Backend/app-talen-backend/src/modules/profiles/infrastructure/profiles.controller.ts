import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { AnalyzeCvDto } from '../application/dto/analyze-cv.dto';
import { CreateProfileDto } from '../application/dto/create-profile.dto';
import { SaveCvDiagnosticDto } from '../application/dto/save-cv-diagnostic.dto';
import { UpdateInterestedRolesDto } from '../application/dto/update-interested-roles.dto';
import { UpdateProfileDto } from '../application/dto/update-profile.dto';
import { UpdateWorkPreferencesDto } from '../application/dto/update-work-preferences.dto';
import { CvAnalysisResponse } from '../domain/cv-analysis-response.type';
import { UploadedCvFile } from '../domain/uploaded-cv-file.type';
import { ProfilesService } from '../application/profiles.service';
import { CvDiagnostic } from './entities/cv-diagnostic.entity';
import { Profile } from './entities/profile.entity';
import { CvAnalysisResponseDto } from '../application/dto/cv-analysis-response.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

const createProfileExample = {
  fullName: 'Ada Lovelace',
  ageRange: '25-34',
  location: 'Buenos Aires, Argentina',
  currentStatus: 'Looking for opportunities',
  headline: 'Frontend developer focused on React and TypeScript',
  professionalBio:
    'Frontend developer with experience building accessible and scalable web applications.',
  yearsExperience: 5,
};

const updateProfileExample = {
  location: 'Córdoba, Argentina',
  headline: 'Senior frontend developer',
};

const workPreferencesExample = {
  country: 'Argentina',
  preferredModality: 'HIBRIDO',
};

const interestedRolesExample = {
  interestedRoles: ['FRONTEND_DEVELOPER', 'UX_UI_DESIGNER'],
};

const profileExample = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: '550e8400-e29b-41d4-a716-446655440001',
  fullName: 'Ada Lovelace',
  ageRange: '25-34',
  location: 'Buenos Aires, Argentina',
  country: 'Argentina',
  preferredModality: 'HIBRIDO',
  interestedRoles: ['FRONTEND_DEVELOPER', 'UX_UI_DESIGNER'],
  currentStatus: 'Looking for opportunities',
  headline: 'Frontend developer focused on React and TypeScript',
  professionalBio:
    'Frontend developer with experience building accessible and scalable web applications.',
  yearsExperience: 5,
  employabilityScore: 82,
};

const saveCvDiagnosticExample = {
  fileName: 'ada-lovelace-cv.pdf',
  rawText: 'Ada Lovelace is a frontend developer...',
  summary: 'Frontend profile with strong React and accessibility background.',
  profile: {
    fullName: 'Ada Lovelace',
    email: 'talent@example.com',
    phone: '+54 11 5555-5555',
    location: 'Buenos Aires, Argentina',
    title: 'Frontend Developer',
    professionalSummary: 'Frontend developer focused on accessibility.',
  },
  skills: {
    technical: ['TypeScript', 'React', 'NestJS'],
    personal: ['Communication', 'Teamwork'],
  },
  experience: [
    {
      company: 'Acme Corp',
      position: 'Frontend Developer',
      startDate: '2021-03',
      endDate: '2024-02',
      description: 'Built the main design system for the product team.',
      highlights: ['Improved performance by 30%'],
    },
  ],
  education: [
    {
      institution: 'Universidad de Buenos Aires',
      degree: 'Computer Science',
      details: 'Thesis focused on HCI.',
      status: 'Completed',
    },
  ],
  aiAnalysis: {
    summary: 'Frontend profile with strong React and accessibility background.',
    suggestedSkills: [
      { name: 'React', category: 'technical', level: 'ADVANCED' },
    ],
  },
};

const cvAnalysisExample = {
  summary: 'Frontend profile with strong React and accessibility background.',
  profileSuggestions: {
    fullName: 'Ada Lovelace',
    location: 'Buenos Aires, Argentina',
    country: 'Argentina',
    preferredModality: 'HIBRIDO',
    headline: 'Frontend Developer',
    professionalBio: 'Frontend profile focused on accessibility.',
    yearsExperience: 5,
    interestedRoles: ['FRONTEND_DEVELOPER', 'UX_UI_DESIGNER'],
  },
  assessmentSuggestions: {
    digitalLevel: 'INTERMEDIATE',
    cognitiveLevel: 'BASIC',
    socioEmotionalLevel: 'INTERMEDIATE',
    careerGoal: 'Become a senior frontend engineer',
    answers: { q1: 'Yes', q2: 'No' },
  },
  suggestedSkills: [
    { name: 'React', category: 'technical', level: 'ADVANCED' },
    { name: 'Accessibility', category: 'technical', level: 'MEDIUM' },
  ],
  fileName: 'ada-lovelace-cv.pdf',
  extractedTextLength: 5420,
  appliedFields: ['headline', 'professionalBio'],
  updatedProfile: profileExample,
  diagnosticId: '550e8400-e29b-41d4-a716-446655440010',
};

const forbiddenResponseExample = {
  statusCode: 403,
  message: 'Only TALENT users can manage profiles',
  error: 'Forbidden',
};

const notFoundResponseExample = {
  statusCode: 404,
  message: 'Profile not found for this user',
  error: 'Not Found',
};

@ApiTags('Perfiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('me')
  @ApiOperation({
    summary: 'Crear mi perfil',
    description:
      'Crea un nuevo perfil para el usuario autenticado. Útil para el registro inicial.',
  })
  @ApiBody({
    type: CreateProfileDto,
    description: 'Datos necesarios para crear el perfil.',
    schema: {
      example: createProfileExample,
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente.',
    type: Profile,
    content: {
      'application/json': {
        example: profileExample,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  createMe(
    @Req() request: AuthenticatedRequest,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.createMe(request.user, createProfileDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener mi perfil',
    description: 'Devuelve la información del perfil del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado.',
    type: Profile,
    content: {
      'application/json': {
        example: profileExample,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado para el usuario autenticado.',
    content: {
      'application/json': {
        example: notFoundResponseExample,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  getMe(@Req() request: AuthenticatedRequest): Promise<Profile> {
    return this.profilesService.getMe(request.user);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Actualizar mi perfil',
    description:
      'Permite modificar los datos del perfil del usuario autenticado.',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Datos a actualizar en el perfil.',
    schema: {
      example: updateProfileExample,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado.',
    type: Profile,
    content: {
      'application/json': {
        example: {
          ...profileExample,
          location: 'Córdoba, Argentina',
          headline: 'Senior frontend developer',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.updateMe(request.user, updateProfileDto);
  }

  @Patch('me/preferences')
  @ApiOperation({
    summary: 'Actualizar mis preferencias laborales',
    description:
      'Actualiza las preferencias de trabajo del usuario (país, modalidad, etc.).',
  })
  @ApiBody({
    type: UpdateWorkPreferencesDto,
    description: 'Preferencias laborales a actualizar.',
    schema: {
      example: workPreferencesExample,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencias actualizadas.',
    type: Profile,
    content: {
      'application/json': {
        example: {
          ...profileExample,
          country: 'Argentina',
          preferredModality: 'HIBRIDO',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Actualizar roles de interés',
    description:
      'Permite definir o modificar los roles laborales de interés del usuario.',
  })
  @ApiBody({
    type: UpdateInterestedRolesDto,
    description: 'Lista de roles de interés.',
    schema: {
      example: interestedRolesExample,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Roles de interés actualizados.',
    type: Profile,
    content: {
      'application/json': {
        example: {
          ...profileExample,
          interestedRoles: ['FRONTEND_DEVELOPER', 'UX_UI_DESIGNER'],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Recalcular mi puntaje de empleabilidad',
    description:
      'Recalcula el puntaje de empleabilidad del usuario según los datos actuales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Puntaje recalculado.',
    type: Profile,
    content: {
      'application/json': {
        example: { ...profileExample, employabilityScore: 91 },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  recalculateMyEmployabilityScore(
    @Req() request: AuthenticatedRequest,
  ): Promise<Profile> {
    return this.profilesService.recalculateMyEmployabilityScore(request.user);
  }

  @Post('me/cv/analyze')
  @ApiOperation({
    summary: 'Analizar mi CV con IA',
    description:
      'Sube y analiza tu currículum (CV) usando inteligencia artificial para extraer información relevante y sugerir mejoras.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo PDF del CV y opciones de análisis.',
    schema: {
      type: 'object',
      example: {
        extractedText:
          'Frontend developer with 5 years of experience in React, TypeScript and accessibility.',
        applyToProfile: true,
      },
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del currículum (máx. 5MB)',
        },
        extractedText: {
          type: 'string',
          description: 'Texto extraído manualmente del CV (opcional)',
        },
        applyToProfile: {
          type: 'boolean',
          description:
            'Si es true, aplica los datos sugeridos al perfil automáticamente.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Análisis exitoso. Devuelve sugerencias y datos extraídos.',
    type: CvAnalysisResponseDto,
    content: {
      'application/json': {
        example: cvAnalysisExample,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se pudo generar el análisis del CV.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'CV analysis could not be generated',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  analyzeMyCv(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedCvFile | undefined,
    @Body() analyzeCvDto: AnalyzeCvDto,
  ): Promise<CvAnalysisResponse> {
    return this.profilesService.analyzeMyCv(request.user, file, analyzeCvDto);
  }

  @Post('me/cv/diagnostics')
  @ApiOperation({
    summary: 'Guardar diagnóstico inicial de CV',
    description:
      'Guarda el resultado del CV parseado en frontend (perfil, skills técnicas/personales y resumen inicial).',
  })
  @ApiBody({
    type: SaveCvDiagnosticDto,
    description: 'Datos del diagnóstico inicial del CV.',
    schema: {
      example: saveCvDiagnosticExample,
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Diagnóstico guardado exitosamente.',
    type: CvDiagnostic,
    content: {
      'application/json': {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          profileId: '550e8400-e29b-41d4-a716-446655440000',
          fileName: 'ada-lovelace-cv.pdf',
          extractedTextLength: 5420,
          rawText: 'Ada Lovelace is a frontend developer...',
          summary:
            'Frontend profile with strong React and accessibility background.',
          technicalSkills: ['TypeScript', 'React', 'NestJS'],
          personalSkills: ['Communication', 'Teamwork'],
          snapshot: {
            profile: saveCvDiagnosticExample.profile,
            skills: saveCvDiagnosticExample.skills,
            experience: saveCvDiagnosticExample.experience,
            education: saveCvDiagnosticExample.education,
          },
          aiAnalysis: saveCvDiagnosticExample.aiAnalysis,
          createdAt: '2026-05-19T12:34:56.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  saveMyCvDiagnostic(
    @Req() request: AuthenticatedRequest,
    @Body() saveCvDiagnosticDto: SaveCvDiagnosticDto,
  ): Promise<CvDiagnostic> {
    return this.profilesService.saveMyCvDiagnostic(
      request.user,
      saveCvDiagnosticDto,
    );
  }

  @Get('me/cv/diagnostics')
  @ApiOperation({
    summary: 'Listar historial de diagnósticos de CV',
    description:
      'Devuelve todos los diagnósticos de CV del usuario autenticado, del más reciente al más antiguo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de diagnósticos obtenido.',
    type: [CvDiagnostic],
    content: {
      'application/json': {
        example: [
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            profileId: '550e8400-e29b-41d4-a716-446655440000',
            fileName: 'ada-lovelace-cv.pdf',
            extractedTextLength: 5420,
            rawText: 'Ada Lovelace is a frontend developer...',
            summary:
              'Frontend profile with strong React and accessibility background.',
            technicalSkills: ['TypeScript', 'React', 'NestJS'],
            personalSkills: ['Communication', 'Teamwork'],
            snapshot: {
              profile: saveCvDiagnosticExample.profile,
              skills: saveCvDiagnosticExample.skills,
              experience: saveCvDiagnosticExample.experience,
              education: saveCvDiagnosticExample.education,
            },
            aiAnalysis: saveCvDiagnosticExample.aiAnalysis,
            createdAt: '2026-05-19T12:34:56.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  findMyCvDiagnostics(
    @Req() request: AuthenticatedRequest,
  ): Promise<CvDiagnostic[]> {
    return this.profilesService.findMyCvDiagnostics(request.user);
  }

  @Get('me/cv/diagnostics/latest')
  @ApiOperation({
    summary: 'Obtener último diagnóstico de CV',
    description:
      'Devuelve el diagnóstico de CV más reciente del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Último diagnóstico obtenido.',
    type: CvDiagnostic,
    content: {
      'application/json': {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          profileId: '550e8400-e29b-41d4-a716-446655440000',
          fileName: 'ada-lovelace-cv.pdf',
          extractedTextLength: 5420,
          rawText: 'Ada Lovelace is a frontend developer...',
          summary:
            'Frontend profile with strong React and accessibility background.',
          technicalSkills: ['TypeScript', 'React', 'NestJS'],
          personalSkills: ['Communication', 'Teamwork'],
          snapshot: {
            profile: saveCvDiagnosticExample.profile,
            skills: saveCvDiagnosticExample.skills,
            experience: saveCvDiagnosticExample.experience,
            education: saveCvDiagnosticExample.education,
          },
          aiAnalysis: saveCvDiagnosticExample.aiAnalysis,
          createdAt: '2026-05-19T12:34:56.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los usuarios TALENT pueden administrar perfiles.',
    content: {
      'application/json': {
        example: forbiddenResponseExample,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron diagnósticos de CV para el usuario.',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'No CV diagnostics found for this user',
          error: 'Not Found',
        },
      },
    },
  })
  findMyLatestCvDiagnostic(
    @Req() request: AuthenticatedRequest,
  ): Promise<CvDiagnostic> {
    return this.profilesService.findMyLatestCvDiagnostic(request.user);
  }
}
