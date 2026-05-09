import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { CreateAssessmentDto } from '../../assessment/application/dto/create-assessment.dto';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { AiAssessmentAnalysis } from '../domain/ai-assessment-analysis.type';

@Injectable()
export class AiAssessmentService {
  private readonly logger = new Logger(AiAssessmentService.name);
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

  async analyzeAssessment(
    profile: Profile,
    assessment: CreateAssessmentDto,
  ): Promise<AiAssessmentAnalysis | null> {
    if (!this.client) {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Skipping AI analysis.',
      );
      return null;
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: JSON.stringify({
          profile: {
            fullName: profile.fullName,
            ageRange: profile.ageRange,
            location: profile.location,
            currentStatus: profile.currentStatus,
            headline: profile.headline,
            professionalBio: profile.professionalBio,
            yearsExperience: profile.yearsExperience,
          },
          assessment,
        }),
        config: {
          systemInstruction:
            'Eres un analista de empleabilidad. Evalua perfiles de talento y assessments para detectar brechas de habilidades. Responde en espanol neutro. No hagas diagnosticos medicos, psicologicos ni clinicos.',
          responseMimeType: 'application/json',
          responseJsonSchema: this.getAssessmentAnalysisSchema(),
        },
      });

      return this.parseAssessmentAnalysis(response.text ?? '');
    } catch (error) {
      this.logger.warn(
        `AI assessment analysis failed: ${this.getErrorMessage(error)}`,
      );
      return null;
    }
  }

  private parseAssessmentAnalysis(outputText: string): AiAssessmentAnalysis {
    if (!outputText) {
      throw new Error('AI response was empty');
    }

    const parsed = JSON.parse(outputText) as unknown;

    if (!this.isAssessmentAnalysis(parsed)) {
      throw new Error('AI response does not match assessment analysis schema');
    }

    return parsed;
  }

  private isAssessmentAnalysis(value: unknown): value is AiAssessmentAnalysis {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.summary === 'string' &&
      this.isRecord(value.detectedGaps) &&
      this.isStringArray(value.detectedGaps.gaps) &&
      this.isStringArray(value.detectedGaps.recommendedFocus) &&
      this.isStringArray(value.detectedGaps.riskFactors) &&
      Array.isArray(value.detectedGaps.recommendedModules) &&
      Array.isArray(value.detectedGaps.suggestedSkills)
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isStringArray(value: unknown): value is string[] {
    return (
      Array.isArray(value) && value.every((item) => typeof item === 'string')
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private getAssessmentAnalysisSchema(): Record<string, unknown> {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'detectedGaps'],
      properties: {
        summary: {
          type: 'string',
          description: 'Resumen breve del diagnostico de empleabilidad.',
        },
        detectedGaps: {
          type: 'object',
          additionalProperties: false,
          required: [
            'gaps',
            'recommendedFocus',
            'riskFactors',
            'recommendedModules',
            'suggestedSkills',
          ],
          properties: {
            gaps: {
              type: 'array',
              items: { type: 'string' },
            },
            recommendedFocus: {
              type: 'array',
              items: { type: 'string' },
            },
            riskFactors: {
              type: 'array',
              items: { type: 'string' },
            },
            recommendedModules: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'category', 'description', 'durationMin'],
                properties: {
                  title: { type: 'string' },
                  category: {
                    type: 'string',
                    enum: ['digital', 'cognitive', 'socio_emotional'],
                  },
                  description: { type: 'string' },
                  durationMin: { type: 'number' },
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
                    enum: ['INITIAL', 'MEDIUM', 'ADVANCED'],
                  },
                },
              },
            },
          },
        },
      },
    };
  }
}
