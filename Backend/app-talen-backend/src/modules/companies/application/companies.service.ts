import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../infrastructure/entities/company.entity';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
  ) {}

  async create(
    userId: string,
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    // Check if company already exists for this user
    const existingCompany = await this.companiesRepository.findOne({
      where: { userId },
    });

    if (existingCompany) {
      throw new ConflictException('This user already has a company profile');
    }

    const company = this.companiesRepository.create({
      userId,
      ...createCompanyDto,
    });

    return this.companiesRepository.save(company);
  }

  async findByUserId(userId: string): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    return company;
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(
    userId: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findByUserId(userId);

    Object.assign(company, updateCompanyDto);

    return this.companiesRepository.save(company);
  }

  async delete(userId: string): Promise<void> {
    const company = await this.findByUserId(userId);

    await this.companiesRepository.remove(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companiesRepository.find({
      relations: ['user'],
    });
  }
}
