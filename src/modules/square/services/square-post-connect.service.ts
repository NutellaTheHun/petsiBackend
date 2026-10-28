import { Injectable } from '@nestjs/common';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationSyncService } from './square-location-sync.service';

/**
 * Runs after the OAuth callback has stored a `connected` connection: the
 * extension point for the first syncs. Location sync runs here; the full
 * catalog sync (task 07) joins it. It must never import orders: every
 * location link starts disabled, and enabling one triggers the import.
 */
@Injectable()
export class SquarePostConnectService {
    constructor(private readonly locationSync: SquareLocationSyncService) {}

    async run(connection: SquareConnection): Promise<void> {
        await this.locationSync.sync(connection);
        // Full catalog sync (task 07).
    }
}
