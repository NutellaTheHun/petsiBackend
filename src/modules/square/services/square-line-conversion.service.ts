import { Injectable } from '@nestjs/common';

/**
 * Converts pending unresolved lines whose variation or modifier links just
 * became mapped (or, for modifiers, ignored):
 * the extension point task 15 fills in (one transaction per active,
 * non-frozen, non-detached order, with the resolving user as revision actor).
 * Called by `SquareCatalogMappingService` after every hint, alias or manual
 * link change that maps a link, and after a modifier mapping (with the
 * siblings it propagated to).
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

    convertForModifierLinks(
        _tenantId: number,
        _modifierLinkIds: number[],
    ): Promise<void> {
        // Pending-line conversion (task 15).
        return Promise.resolve();
    }
}
