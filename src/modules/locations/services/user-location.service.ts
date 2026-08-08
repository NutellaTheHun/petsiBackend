import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { LocationScopedServiceBase } from '../../../common/base/location-scoped-service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entities';
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { UpdateUserLocationDto } from '../dto/update-user-location.dto';
import { UserLocation, UserLocationEntity } from '../entities/user-location.entity';
import { UserLocationChangeDetector } from '../utils/change-detectors/user-location.change-detector';
import { UserLocationValidator } from '../validators/user-location.validator';

@Injectable()
export class UserLocationService extends LocationScopedServiceBase<UserLocationEntity> {
    constructor(
        @InjectRepository(UserLocation)
        repo: Repository<UserLocation>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: UserLocationValidator,
        private readonly userLocationChangeDetector: UserLocationChangeDetector,
    ) {
        super(repo, 'UserLocationService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateUserLocationDto,
        manager: EntityManager,
    ): Promise<UserLocation> {
        const result = manager.create(UserLocation, {
            tenantId: this.getTenantId(),
            locationId: dto.locationId,
            user: { id: dto.userId } as User,
            roles: (dto.roleIds ?? []).map((id) => ({ id }) as Role),
        });
        return await manager.save(result);
    }

    protected async updateEntity(
        dto: UpdateUserLocationDto,
        manager: EntityManager,
        entity: UserLocation,
    ): Promise<void> {
        if (dto.locationId !== undefined) {
            entity.locationId = dto.locationId;
        }
        if (dto.roleIds !== undefined) {
            entity.roles = dto.roleIds.map((id) => ({ id }) as Role);
        }
        await manager.save(entity);
    }

    protected applyFilters(
        query: SelectQueryBuilder<UserLocation>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.user && filters.user.length > 0) {
            query.andWhere('entity.user IN (:...users)', { users: filters.user });
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<UserLocation, UpdateUserLocationDto> | undefined {
        return this.userLocationChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return ['roles'];
    }
}
