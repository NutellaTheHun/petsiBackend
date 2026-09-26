import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TenantScopedServiceBase } from '../../../common/base/tenant-scoped-service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRoleFeatureDto } from '../dto/create-role-feature.dto';
import { UpdateRoleFeatureDto } from '../dto/update-role-feature.dto';
import { RoleFeature, RoleFeatureEntity } from '../entities/role-feature.entity';

@Injectable()
export class RoleFeatureService extends TenantScopedServiceBase<RoleFeatureEntity> {
    constructor(
        @InjectRepository(RoleFeature)
        repo: Repository<RoleFeature>,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) {
        super(repo, 'RoleFeatureService', requestContextService, logger);
    }

    protected async createEntity(
        dto: CreateRoleFeatureDto,
        manager: EntityManager,
    ): Promise<RoleFeature> {
        const result = manager.create(RoleFeature, {
            tenantId: this.getTenantId(),
            roleId: dto.roleId,
            feature: dto.feature,
        });
        return await manager.save(result);
    }

    // Grants are added/removed, never edited in place — there is no mutable
    // field on this entity shape for `updateEntity` to apply.
    protected async updateEntity(
        _dto: UpdateRoleFeatureDto,
        _manager: EntityManager,
        _entity: RoleFeature,
    ): Promise<void> {
        return;
    }
}
