import { Injectable } from '@nestjs/common';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareCatalogSyncService } from './square-catalog-sync.service';
import { SquareLocationSyncService } from './square-location-sync.service';

/**
 * Runs after the OAuth callback has stored a `connected` connection: the
 * first location sync and the full catalog sync. It must never import orders:
 * every location link starts disabled, and enabling one triggers the import.
 */
@Injectable()
export class SquarePostConnectService {
    constructor(
        private readonly locationSync: SquareLocationSyncService,
        private readonly catalogSync: SquareCatalogSyncService,
    ) {}

    async run(connection: SquareConnection): Promise<void> {
        await this.locationSync.sync(connection);
        await this.catalogSync.fullSync(connection);
    }
}
