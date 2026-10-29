import { Injectable } from '@nestjs/common';

/**
 * Converts pending unresolved lines whose variation links just became mapped:
 * the extension point task 15 fills in (one transaction per active,
 * non-frozen, non-detached order, with the resolving user as revision actor).
 * Called by `SquareCatalogMappingService` after every hint, alias or manual
 * link change that maps a link.
 */
@Injectable()
export class SquareLineConversionService {
    convertForVariationLinks(
        _tenantId: number,
        _variationLinkIds: number[],
    ): Promise<void> {
        // Pending-line conversion (task 15).
        return Promise.resolve();
    }
}
