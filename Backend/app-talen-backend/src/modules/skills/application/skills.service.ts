import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { CreateUserSkillDto } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { Skill } from '../infrastructure/entities/skill.entity';
import { UserSkill } from '../infrastructure/entities/user-skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(UserSkill)
    private readonly userSkillsRepository: Repository<UserSkill>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async findMine(authUser: AuthTokenPayload): Promise<UserSkill[]> {
    const profile = await this.findTalentProfile(authUser);

    return this.userSkillsRepository.find({
      where: { profileId: profile.id },
      relations: { skill: true },
      order: { skill: { name: 'ASC' } },
    });
  }

  async createMine(
    authUser: AuthTokenPayload,
    createUserSkillDto: CreateUserSkillDto,
  ): Promise<UserSkill> {
    const profile = await this.findTalentProfile(authUser);
    const skill = await this.findOrCreateSkill(
      createUserSkillDto.name,
      createUserSkillDto.category,
    );
    const existingUserSkill = await this.userSkillsRepository.findOne({
      where: {
        profileId: profile.id,
        skillId: skill.id,
      },
    });

    if (existingUserSkill) {
      existingUserSkill.level = createUserSkillDto.level;
      existingUserSkill.evidence = createUserSkillDto.evidence;
      existingUserSkill.source = createUserSkillDto.source;
      await this.userSkillsRepository.save(existingUserSkill);
      return this.findMyUserSkillBySkillId(profile.id, existingUserSkill.skillId);
    }

    const userSkill = this.userSkillsRepository.create({
      profileId: profile.id,
      skillId: skill.id,
      level: createUserSkillDto.level,
      evidence: createUserSkillDto.evidence,
      source: createUserSkillDto.source,
    });

    try {
      const savedUserSkill = await this.userSkillsRepository.save(userSkill);
      return this.findMyUserSkillBySkillId(profile.id, savedUserSkill.skillId);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const persistedUserSkill = await this.findMyUserSkillBySkillId(
          profile.id,
          skill.id,
        );
        persistedUserSkill.level = createUserSkillDto.level;
        persistedUserSkill.evidence = createUserSkillDto.evidence;
        persistedUserSkill.source = createUserSkillDto.source;
        await this.userSkillsRepository.save(persistedUserSkill);
        return this.findMyUserSkillBySkillId(profile.id, skill.id);
      }

      throw error;
    }
  }

  async updateMine(
    authUser: AuthTokenPayload,
    skillId: string,
    updateUserSkillDto: UpdateUserSkillDto,
  ): Promise<UserSkill> {
    const profile = await this.findTalentProfile(authUser);
    const userSkill = await this.findMyUserSkillBySkillId(profile.id, skillId);

    this.userSkillsRepository.merge(userSkill, updateUserSkillDto);
    await this.userSkillsRepository.save(userSkill);

    return this.findMyUserSkillBySkillId(profile.id, skillId);
  }

  private async findOrCreateSkill(
    name: string,
    category: string,
  ): Promise<Skill> {
    const normalizedName = name.trim().toLowerCase();
    const normalizedCategory = category.trim().toLowerCase();
    const existingSkill = await this.skillsRepository.findOne({
      where: { name: normalizedName },
    });

    if (existingSkill) {
      return existingSkill;
    }

    try {
      return await this.skillsRepository.save(
        this.skillsRepository.create({
          name: normalizedName,
          category: normalizedCategory,
        }),
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const skill = await this.skillsRepository.findOne({
          where: { name: normalizedName },
        });

        if (skill) {
          return skill;
        }
      }

      throw error;
    }
  }

  private async findMyUserSkillBySkillId(
    profileId: string,
    skillId: string,
  ): Promise<UserSkill> {
    const userSkill = await this.userSkillsRepository.findOne({
      where: { profileId, skillId },
      relations: { skill: true },
    });

    if (!userSkill) {
      throw new NotFoundException('Skill not found for this user');
    }

    return userSkill;
  }

  private async findTalentProfile(
    authUser: AuthTokenPayload,
  ): Promise<Profile> {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only TALENT users can manage skills');
    }

    const profile = await this.profilesRepository.findOne({
      where: { userId: authUser.userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
