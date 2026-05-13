import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CompaniesService } from '../../application/companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Company } from '../entities/company.entity';
import type { AuthenticatedRequest } from '../../../auth/infrastructure/types/authenticated-request.type';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  async createProfile(
    @Req() request: AuthenticatedRequest,
    @Body() createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.create(request.user.userId, createCompanyDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request: AuthenticatedRequest): Promise<Company> {
    return this.companiesService.findByUserId(request.user.userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(request.user.userId, updateCompanyDto);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.companiesService.delete(request.user.userId);
    return { message: 'Company profile deleted successfully' };
  }

  @Get()
  async getAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  async getById(@Req() request: any): Promise<Company> {
    return this.companiesService.findById(request.params.id);
  }
}
