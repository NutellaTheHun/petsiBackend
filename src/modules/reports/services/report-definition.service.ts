import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateReportDefinitionDto } from '../dto/create-report-definition.dto';
import { UpdateReportDefinitionDto } from '../dto/update-report-definition.dto';
import { ReportDefinition } from '../entities/report-definition.entity';

@Injectable()
export class ReportDefinitionService {
    constructor(
        @InjectRepository(ReportDefinition)
        private readonly repo: Repository<ReportDefinition>,
        private readonly requestContextService: RequestContextService,
    ) {}

    async create(dto: CreateReportDefinitionDto): Promise<ReportDefinition> {
        const entity = this.repo.create({
            name: dto.name,
            visibility: dto.visibility,
            showHeader: dto.showHeader ?? true,
            params: dto.params ?? [],
            sections: dto.sections ?? [],
        });
        return this.repo.save(entity);
    }

    async findAll(): Promise<ReportDefinition[]> {
        const roles = this.requestContextService.get<string[]>('roles') ?? [];
        const canSeeAll = roles.includes(ROLE_MANAGER) || roles.includes(ROLE_ADMIN);

        const qb = this.repo.createQueryBuilder('rd');
        if (!canSeeAll) {
            qb.where('rd.visibility = :vis', { vis: 'staff' });
        }
        return qb.getMany();
    }

    async findOne(id: number): Promise<ReportDefinition> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) {
            throw new NotFoundException(`ReportDefinition #${id} not found`);
        }
        return entity;
    }

    async update(id: number, dto: UpdateReportDefinitionDto): Promise<ReportDefinition> {
        const entity = await this.findOne(id);
        if (dto.name !== undefined) entity.name = dto.name;
        if (dto.visibility !== undefined) entity.visibility = dto.visibility;
        if (dto.showHeader !== undefined) entity.showHeader = dto.showHeader;
        if (dto.params !== undefined) entity.params = dto.params;
        if (dto.sections !== undefined) entity.sections = dto.sections;
        return this.repo.save(entity);
    }

    async remove(id: number): Promise<void> {
        const entity = await this.findOne(id);
        await this.repo.remove(entity);
    }
}
