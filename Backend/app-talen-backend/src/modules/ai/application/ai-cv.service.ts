import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssessmentLevel } from '../../assessment/domain/assessment-level.enum';
import { InterestedRole } from '../../profiles/domain/interested-role.enum';
import { WorkModality } from '../../profiles/domain/work-modality.enum';
import { SkillLevel } from '../../skills/domain/skill-level.enum';
import { AiCvAnalysis } from '../domain/ai-cv-analysis.type';

@Injectable()
export class AiCvService {
  private readonly logger = new Logger(AiCvService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash',
    );
  }

  async analyzeCv(cvText: string): Promise<AiCvAnalysis | null> {
    if (!this.client) {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Skipping CV analysis.',
      );
      return null;
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: JSON.stringify({ cvText }),
        config: {
          systemInstruction:
            'Eres un asistente de empleabilidad. Analiza CVs para sugerir datos de perfil, assessment inicial y skills. Responde en espanol neutro. No inventes datos personales que no esten en el CV; si algo no aparece, omite el campo. Clasifica skills tecnicas como competencias del oficio o profesion (ej: medico, contador, administrador, desarrollador, mecanico, militar) y skills personales como habilidades blandas (ej: comunicacion, liderazgo, empatia).',
          responseMimeType: 'application/json',
          responseJsonSchema: this.getCvAnalysisSchema(),
        },
      });

      return this.parseCvAnalysis(response.text ?? '');
    } catch (error) {
      this.logger.warn(`AI CV analysis failed: ${this.getErrorMessage(error)}`);
      return null;
    }
  }

  private parseCvAnalysis(outputText: string): AiCvAnalysis {
    if (!outputText) {
      throw new Error('AI response was empty');
    }

    const parsed = JSON.parse(outputText) as unknown;

    if (!this.isCvAnalysis(parsed)) {
      throw new Error('AI response does not match CV analysis schema');
    }

    return parsed;
  }

  private isCvAnalysis(value: unknown): value is AiCvAnalysis {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.summary === 'string' &&
      this.isRecord(value.profileSuggestions) &&
      this.isRecord(value.assessmentSuggestions) &&
      this.isRecord(value.assessmentSuggestions.answers) &&
      Array.isArray(value.suggestedSkills)
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private getCvAnalysisSchema(): Record<string, unknown> {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'summary',
        'profileSuggestions',
        'assessmentSuggestions',
        'suggestedSkills',
      ],
      properties: {
        summary: { type: 'string' },
        profileSuggestions: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fullName: { type: 'string' },
            location: { type: 'string' },
            country: { type: 'string' },
            preferredModality: {
              type: 'string',
              enum: Object.values(WorkModality),
            },
            headline: { type: 'string' },
            professionalBio: { type: 'string' },
            yearsExperience: { type: 'number' },
            interestedRoles: {
              type: 'array',
              items: {
                type: 'string',
                enum: Object.values(InterestedRole),
              },
            },
          },
        },
        assessmentSuggestions: {
          type: 'object',
          additionalProperties: false,
          required: ['answers'],
          properties: {
            digitalLevel: {
              type: 'string',
              enum: Object.values(AssessmentLevel),
            },
            cognitiveLevel: {
              type: 'string',
              enum: Object.values(AssessmentLevel),
            },
            socioEmotionalLevel: {
              type: 'string',
              enum: Object.values(AssessmentLevel),
            },
            careerGoal: { type: 'string' },
            answers: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        suggestedSkills: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'category', 'level'],
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              level: {
                type: 'string',
                enum: Object.values(SkillLevel),
              },
            },
          },
        },
      },
    };
  }
}
