import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { UserRole } from '../../users/domain/user-role.enum';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../infrastructure/entities/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async createMe(
    authUser: AuthTokenPayload,
    createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const existingProfile = await this.profilesRepository.findOne({
      where: { userId: authUser.userId },
    });

    if (existingProfile) {
      this.profilesRepository.merge(existingProfile, createProfileDto);
      return this.profilesRepository.save(existingProfile);
    }

    const profile = this.profilesRepository.create({
      ...createProfileDto,
      userId: authUser.userId,
    });

    return this.profilesRepository.save(profile);
  }

  async getMe(authUser: AuthTokenPayload): Promise<Profile> {
    this.ensureTalent(authUser);

    return this.findMyProfile(authUser.userId);
  }

  async updateMe(
    authUser: AuthTokenPayload,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    this.profilesRepository.merge(profile, updateProfileDto);

    return this.profilesRepository.save(profile);
  }

  private async findMyProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }

  private ensureTalent(authUser: AuthTokenPayload): void {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only TALENT users can manage profiles');
    }
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
