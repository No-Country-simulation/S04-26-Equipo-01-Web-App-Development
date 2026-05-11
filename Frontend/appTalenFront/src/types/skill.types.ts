export const SkillLevel = {
  INITIAL: 'INITIAL',
  MEDIUM: 'MEDIUM',
  ADVANCED: 'ADVANCED',
} as const;

export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  id: string;
  profileId: string;
  skillId: string;
  level: SkillLevel;
  evidence?: string;
  source?: string;
  skill?: Skill;
}

export interface CreateUserSkillDto {
  name: string;
  category: string;
  level: SkillLevel;
  evidence?: string;
  source?: string;
}

export interface UpdateUserSkillDto {
  level?: SkillLevel;
  evidence?: string;
  source?: string;
}
