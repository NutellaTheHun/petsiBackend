import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { invalidateFindAllCache } from '../../../infrastructure/cache/cache.util';
import { Location } from '../../locations/entities/location.entity';
import { LocationService } from '../../locations/services/location.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareLocationImportResultDto } from '../dto/square-location-import-result.dto';
import { SquareLocationLinkDto } from '../dto/square-location-link.dto';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareLocationImportService } from './square-location-import.service';

/**
 * The tenant admin's actions on location links: list, map/unmap, create a
 * Petsi location from a Square one, enable/disable. Every method scopes to the
 * caller's tenant; a link in another tenant is a 404. Rows are created only by
 * `SquareLocationSyncService`.
 */
@Injectable()
export class SquareLocationLinkService {
    constructor(
        @InjectRepository(SquareLocationLink)
        private readonly linkRepo: Repository<SquareLocationLink>,
        @InjectRepository(Location)
        private readonly locationRepo: Repository<Location>,
        private readonly locationService: LocationService,
        private readonly importService: SquareLocationImportService,
        private readonly requestContextService: RequestContextService,
        // LocationsModule's cache, so a location created here shows up in
        // `GET /locations` straight away
        @Inject(CACHE_MANAGER) private readonly locationCache: Cache,
    ) {}

    async findAllForCurrentTenant(): Promise<SquareLocationLinkDto[]> {
        const links = await this.linkRepo.find({
            where: { tenantId: this.getTenantId() },
            order: { squareName: 'ASC', id: 'ASC' },
        });
        return links.map(toDto);
    }

    /**
     * Maps the link to a Petsi location in the caller's tenant, or unmaps it
     * with `null`. Unmapping also disables it, since only a mapped link can be
     * enabled.
     */
    async setLocationForCurrentTenant(
        id: number,
        locationId: number | null,
    ): Promise<SquareLocationLinkDto> {
        const link = await this.findLinkOrThrow(id);
        if (locationId != null) {
            const location = await this.locationRepo.findOne({
                where: { id: locationId, tenantId: link.tenantId },
            });
            if (!location) {
                const errorMap = new ValidationErrorMap(link.id);
                errorMap.addError(
                    'REFERENCE_NOT_FOUND',
                    undefined,
                    ['locationId'],
                    { value: locationId },
                );
                throw new ValidationException(errorMap);
            }
        }
        await this.linkRepo.update(
            { id: link.id },
            locationId == null
                ? { locationId: null, enabled: false }
                : { locationId },
        );
        return toDto(await this.linkRepo.findOneByOrFail({ id: link.id }));
    }

    /**
     * Creates a Petsi location named after the Square location, through
     * `LocationService` and its validator, and maps the link to it.
     */
    async createLocationForCurrentTenant(
        id: number,
    ): Promise<SquareLocationLinkDto> {
        const link = await this.findLinkOrThrow(id);
        const location = await this.locationService.create({
            name: link.squareName,
        });
        await invalidateFindAllCache(
            this.locationService.servicePrefix,
            this.locationCache,
            this.locationService.getCacheInvalidationScope(),
        );
        await this.linkRepo.update(
            { id: link.id },
            { locationId: location.id },
        );
        return toDto(await this.linkRepo.findOneByOrFail({ id: link.id }));
    }

    /**
     * Enabling requires a mapped Petsi location and a live Square connection,
     * and runs the location's initial order import as the caller. Setting the
     * current value again does nothing. If the import itself fails, the link
     * stays enabled and "Re-sync location" retries it.
     */
    async setEnabledForCurrentTenant(
        id: number,
        enabled: boolean,
    ): Promise<SquareLocationLinkDto> {
        const link = await this.findLinkOrThrow(id);
        if (link.enabled === enabled) {
            return toDto(link);
        }
        if (enabled && link.locationId == null) {
            const errorMap = new ValidationErrorMap(link.id);
            errorMap.addError('MISSING_PROPERTY', undefined, ['locationId']);
            throw new ValidationException(errorMap);
        }
        if (enabled) {
            await this.importService.requireConnection(link.tenantId);
        }
        await this.linkRepo.update({ id: link.id }, { enabled });
        const updated = await this.linkRepo.findOneByOrFail({ id: link.id });
        if (enabled) {
            await this.importService.importLocation(updated, this.getUserId());
        }
        return toDto(updated);
    }

    /**
     * Re-runs the initial import for an enabled link as the caller, to
     * recover orders missed while webhooks weren't arriving.
     */
    async resyncForCurrentTenant(
        id: number,
    ): Promise<SquareLocationImportResultDto> {
        const link = await this.findLinkOrThrow(id);
        if (!link.enabled) {
            const errorMap = new ValidationErrorMap(link.id);
            errorMap.addError('INCONSISTENT_STATE', undefined, ['enabled']);
            throw new ValidationException(errorMap);
        }
        return this.importService.importLocation(link, this.getUserId());
    }

    private async findLinkOrThrow(id: number): Promise<SquareLocationLink> {
        const link = await this.linkRepo.findOne({
            where: { id, tenantId: this.getTenantId() },
        });
        if (!link) {
            throw new NotFoundException();
        }
        return link;
    }

    /** The caller's tenant, from the request context; never a client-supplied id. */
    private getTenantId(): number {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        return tenantId;
    }

    private getUserId(): number | undefined {
        return this.requestContextService.get<number>('userId');
    }
}

function toDto(link: SquareLocationLink): SquareLocationLinkDto {
    return {
        id: link.id,
        squareLocationId: link.squareLocationId,
        squareName: link.squareName,
        squareStatus: link.squareStatus,
        timezone: link.timezone,
        enabled: link.enabled,
        locationId: link.locationId,
    };
}
