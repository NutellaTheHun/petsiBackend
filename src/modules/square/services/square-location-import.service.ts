import { Injectable } from '@nestjs/common';
import { SquareLocationLink } from '../entities/square-location-link.entity';

/**
 * The initial order import for one location link: the extension point task 12
 * fills in (search the location's future-due pickup/delivery orders and ingest
 * each). Called when a tenant admin enables a link, and later by the manual
 * "Re-sync location" action. Never from a sync, the OAuth callback or a cron.
 */
@Injectable()
export class SquareLocationImportService {
    importLocation(_link: SquareLocationLink): Promise<void> {
        // Initial import (task 12).
        return Promise.resolve();
    }
}
