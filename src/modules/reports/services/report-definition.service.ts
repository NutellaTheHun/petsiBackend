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

    /**
     * The caller's tenant, from `RequestContextService` — never trust a
     * client-supplied tenantId on a DTO. Mirrors
     * `TenantScopedServiceBase.getTenantId()`; this service predates that
     * base class and isn't wired into the `ServiceBase` hierarchy, so tenant
     * scoping is hand-rolled here rather than inherited.
     */
    private getTenantId(): number {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        return tenantId;
    }

    async create(dto: CreateReportDefinitionDto): Promise<ReportDefinition> {
        const entity = this.repo.create({
            name: dto.name,
            visibility: dto.visibility,
            showHeader: dto.showHeader ?? true,
            params: dto.params ?? [],
            sections: dto.sections ?? [],
            tenantId: this.getTenantId(),
        });
        return this.repo.save(entity);
    }

    async findAll(): Promise<ReportDefinition[]> {
        const roles = this.requestContextService.get<string[]>('roles') ?? [];
        const canSeeAll = roles.includes(ROLE_MANAGER) || roles.includes(ROLE_ADMIN);

        const qb = this.repo
            .createQueryBuilder('rd')
            .where('rd.tenantId = :tenantId', { tenantId: this.getTenantId() });
        if (!canSeeAll) {
            qb.andWhere('rd.visibility = :vis', { vis: 'staff' });
        }
        return qb.getMany();
    }

    async findOne(id: number): Promise<ReportDefinition> {
        const entity = await this.repo.findOne({ where: { id } });
        // A lookup for an id belonging to a different tenant behaves like the
        // id doesn't exist at all — never confirm another tenant's data exists.
        if (!entity || entity.tenantId !== this.getTenantId()) {
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
