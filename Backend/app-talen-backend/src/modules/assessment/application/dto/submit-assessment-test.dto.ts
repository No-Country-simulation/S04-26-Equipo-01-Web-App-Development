import { IsObject } from 'class-validator';

export class SubmitAssessmentTestDto {
  @IsObject()
  answers!: Record<string, string>;
}
