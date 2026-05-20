export type AssessmentQuestionOption = {
  value: string;
  label: string;
};

export type AssessmentTestQuestion = {
  id: string;
  text: string;
  category: string;
  type: 'single_choice';
  options: AssessmentQuestionOption[];
};

export type ScoredAssessmentTestQuestion = AssessmentTestQuestion & {
  correctAnswer: string;
  score: number;
};
