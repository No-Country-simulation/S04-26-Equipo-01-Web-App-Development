import { AiCvAnalysis } from '../../ai/domain/ai-cv-analysis.type';
import { Profile } from '../infrastructure/entities/profile.entity';

export type CvAnalysisResponse = AiCvAnalysis & {
  fileName?: string;
  extractedTextLength: number;
  appliedFields: string[];
  updatedProfile?: Profile;
  diagnosticId?: string;
};
