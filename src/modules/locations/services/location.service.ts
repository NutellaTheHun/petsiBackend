import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { TenantScopedServiceBase } from '../../../common/base/tenant-scoped-service.base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location, LocationEntity } from '../entities/location.entity';
import { LocationChangeDetector } from '../utils/change-detectors/location.change-detector';
import { LocationValidator } from '../validators/location.validator';

@Injectable()
export class LocationService extends TenantScopedServiceBase<LocationEntity> {
    constructor(
        @InjectRepository(Location)
        repo: Repository<Location>,
        requestContextService: RequestContextService,
        validator: LocationValidator,
        private readonly locationChangeDetector: LocationChangeDetector,
    ) {
        super(repo, 'LocationService', requestContextService, validator);
    }

    protected async createEntity(
        dto: CreateLocationDto,
        manager: EntityManager,
    ): Promise<Location> {
        const result = manager.create(Location, {
            tenantId: this.getTenantId(),
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

    protected getChangeDetector(): ChangeDetectorBase<Location, UpdateLocationDto> | undefined {
        return this.locationChangeDetector;
    }
}
