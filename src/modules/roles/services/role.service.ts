import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role, RoleEntity } from '../entities/role.entity';
import { RoleChangeDetector } from '../utils/change-detectors/role.change-detector';
import { RoleValidator } from '../validators/role.validator';

@Injectable()
export class RoleService extends ServiceBase<RoleEntity> {
    constructor(
        @InjectRepository(Role)
        repo: Repository<Role>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: RoleValidator,
        private readonly roleChangeDetector: RoleChangeDetector,
    ) {
        super(repo, 'RoleService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateRoleDto,
        manager: EntityManager,
    ): Promise<Role> {
        const result = manager.create(Role, {
            name: dto.name,
        });
        return await manager.save(result);
    }

    protected async updateEntity(
        dto: UpdateRoleDto,
        manager: EntityManager,
        entity: Role,
    ): Promise<void> {
        if (dto.name !== undefined) {
            entity.name = dto.name;
        }
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<Role>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<Role, UpdateRoleDto> | undefined {
        return this.roleChangeDetector;
    }
}
