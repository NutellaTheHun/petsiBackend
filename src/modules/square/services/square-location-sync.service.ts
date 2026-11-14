import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { normalizeSquareName } from '../utils/square-name';
import { SquareConnectionService } from './square-connection.service';

/**
 * Pulls the seller's locations from Square into `SquareLocationLink` rows.
 * Runs without a request context (the OAuth callback is public), so the tenant
 * comes from the connection.
 */
@Injectable()
export class SquareLocationSyncService {
    constructor(
        @InjectRepository(SquareLocationLink)
        private readonly linkRepo: Repository<SquareLocationLink>,
        @InjectRepository(Location)
        private readonly locationRepo: Repository<Location>,
        private readonly connectionService: SquareConnectionService,
    ) {}

    /**
     * Upserts one link per Square location. Existing links get only their
     * Square-side fields refreshed; `enabled` and `locationId` are never
     * touched. New links start disabled and are auto-matched by name.
     * Locations Square no longer returns keep their links.
     */
    async sync(connection: SquareConnection): Promise<void> {
        const { tenantId } = connection;
        const { locations = [] } = await this.connectionService.callTenant(
            connection,
            (api) => api.locations.list(),
        );

        const existing = new Map(
            (await this.linkRepo.find({ where: { tenantId } })).map((link) => [
                link.squareLocationId,
                link,
            ]),
        );
        let petsiIdsByName: Map<string, number[]> | undefined;

        for (const squareLocation of locations) {
            if (!squareLocation.id) {
                continue;
            }
            const squareFields = {
                squareName: squareLocation.name ?? '',
                squareStatus: squareLocation.status ?? null,
                timezone: squareLocation.timezone ?? null,
            };
            const link = existing.get(squareLocation.id);
            if (link) {
                await this.linkRepo.update({ id: link.id }, squareFields);
                continue;
            }

            petsiIdsByName ??= await this.petsiLocationIdsByName(tenantId);
            const candidates =
                petsiIdsByName.get(
                    normalizeSquareName(squareFields.squareName),
                ) ?? [];
            // A concurrent sync may have inserted it; its row wins.
            await this.linkRepo
                .createQueryBuilder()
                .insert()
                .values({
                    tenantId,
                    squareLocationId: squareLocation.id,
                    ...squareFields,
                    enabled: false,
                    locationId: candidates.length === 1 ? candidates[0] : null,
                })
                .orIgnore()
                .execute();
        }
    }

    private async petsiLocationIdsByName(
        tenantId: number,
    ): Promise<Map<string, number[]>> {
        const byName = new Map<string, number[]>();
        const locations = await this.locationRepo.find({
            where: { tenantId },
            select: { id: true, name: true },
        });
        for (const { id, name } of locations) {
            const key = normalizeSquareName(name);
            byName.set(key, [...(byName.get(key) ?? []), id]);
        }
        return byName;
    }
}
