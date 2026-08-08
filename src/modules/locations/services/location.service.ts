import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location, LocationEntity } from '../entities/location.entity';
import { LocationChangeDetector } from '../utils/change-detectors/location.change-detector';
import { LocationValidator } from '../validators/location.validator';

@Injectable()
export class LocationService extends ServiceBase<LocationEntity> {
    constructor(
        @InjectRepository(Location)
        repo: Repository<Location>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: LocationValidator,
        private readonly locationChangeDetector: LocationChangeDetector,
    ) {
        super(repo, 'LocationService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateLocationDto,
        manager: EntityManager,
    ): Promise<Location> {
        const result = manager.create(Location, {
            tenant: { id: dto.tenantId },
            name: dto.name,
            address: dto.address ?? null,
            phoneNumber: dto.phoneNumber ?? null,
            email: dto.email ?? null,
        });
        return await manager.save(result);
    }

    protected async updateEntity(
        dto: UpdateLocationDto,
        manager: EntityManager,
        entity: Location,
    ): Promise<void> {
        if (dto.tenantId !== undefined) {
            entity.tenant = manager.create(Tenant, { id: dto.tenantId });
        }
        if (dto.name !== undefined) {
            entity.name = dto.name;
        }
        if (dto.address !== undefined) {
            entity.address = dto.address;
        }
        if (dto.phoneNumber !== undefined) {
            entity.phoneNumber = dto.phoneNumber;
        }
        if (dto.email !== undefined) {
            entity.email = dto.email;
        }
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<Location>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    protected applyFilters(
        query: SelectQueryBuilder<Location>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.tenant && filters.tenant.length > 0) {
            query.andWhere('entity.tenant IN (:...tenants)', {
                tenants: filters.tenant,
            });
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<Location, UpdateLocationDto> | undefined {
        return this.locationChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return ['tenant'];
    }
}
