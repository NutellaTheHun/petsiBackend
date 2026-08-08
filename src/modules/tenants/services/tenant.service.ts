import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Tenant, TenantEntity } from '../entities/tenant.entity';
import { TenantChangeDetector } from '../utils/change-detectors/tenant.change-detector';
import { TenantValidator } from '../validators/tenant.validator';

@Injectable()
export class TenantService extends ServiceBase<TenantEntity> {
    constructor(
        @InjectRepository(Tenant)
        repo: Repository<Tenant>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: TenantValidator,
        private readonly tenantChangeDetector: TenantChangeDetector,
    ) {
        super(repo, 'TenantService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateTenantDto,
        manager: EntityManager,
    ): Promise<Tenant> {
        const result = manager.create(Tenant, {
            name: dto.name,
            subdomain: dto.subdomain,
        });
        return await manager.save(result);
    }

    protected async updateEntity(
        dto: UpdateTenantDto,
        manager: EntityManager,
        entity: Tenant,
    ): Promise<void> {
        if (dto.name !== undefined) {
            entity.name = dto.name;
        }
        if (dto.subdomain !== undefined) {
            entity.subdomain = dto.subdomain;
        }
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<Tenant>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name' || sortBy === 'subdomain') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<Tenant, UpdateTenantDto> | undefined {
        return this.tenantChangeDetector;
    }
}
