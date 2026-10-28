import { Injectable } from '@nestjs/common';
import { SquareConnection } from '../entities/square-connection.entity';

/**
 * Runs after the OAuth callback has stored a `connected` connection: the
 * extension point for the first syncs. Location sync (task 06) and the full
 * catalog sync (task 07) are called from `run`. It must never import orders:
 * every location link starts disabled, and enabling one triggers the import.
 */
@Injectable()
export class SquarePostConnectService {
    run(_connection: SquareConnection): Promise<void> {
        // Location sync (task 06), then full catalog sync (task 07).
        return Promise.resolve();
    }
}
