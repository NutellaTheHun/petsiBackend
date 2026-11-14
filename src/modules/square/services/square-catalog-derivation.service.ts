import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import {
    DerivationMenuItem,
    deriveVariationMapping,
} from '../utils/square-catalog-derivation';
import { normalizeSquareName } from '../utils/square-name';

/**
 * Recomputes every `derived` variation link of a tenant from its item hint
 * and size alias (`deriveVariationMapping`). `manual` links are never read or
 * written. Runs after every catalog sync, and after a hint or alias changes.
 */
@Injectable()
export class SquareCatalogDerivationService {
    constructor(
        @InjectRepository(SquareVariationLink)
        private readonly variationRepo: Repository<SquareVariationLink>,
        @InjectRepository(SquareItemHint)
        private readonly hintRepo: Repository<SquareItemHint>,
        @InjectRepository(SquareSizeAlias)
        private readonly aliasRepo: Repository<SquareSizeAlias>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
    ) {}

    /**
     * Writes only links whose derived mapping changed, and returns the ids of
     * those that went from unmapped to mapped (for pending-line conversion).
     */
    async deriveForTenant(
        tenantId: number,
    ): Promise<{ newlyMappedLinkIds: number[] }> {
        const links = await this.variationRepo.find({
            where: { tenantId, mappingSource: Not('manual') },
        });
        if (links.length === 0) {
            return { newlyMappedLinkIds: [] };
        }

        const hintMenuItemIds = new Map(
            (await this.hintRepo.find({ where: { tenantId } })).map((h) => [
                h.squareItemId,
                h.menuItemId,
            ]),
        );
        const aliasSizeIds = new Map(
            (await this.aliasRepo.find({ where: { tenantId } })).map((a) => [
                a.squareVariationName,
                a.menuItemSizeId,
            ]),
        );
        const menuItems = await this.loadMenuItems(
            tenantId,
            [...hintMenuItemIds.values()].filter((id) => id != null),
        );

        const newlyMappedLinkIds: number[] = [];
        for (const link of links) {
            const menuItemId = hintMenuItemIds.get(link.squareItemId);
            const derived = deriveVariationMapping(
                menuItemId == null ? undefined : menuItems.get(menuItemId),
                aliasSizeIds.get(
                    normalizeSquareName(link.squareVariationName),
                ) ?? null,
            );
            if (
                derived.menuItemId === link.menuItemId &&
                derived.menuItemSizeId === link.menuItemSizeId &&
                derived.modifierMode === link.modifierMode
            ) {
                continue;
            }
            // Conditional on `derived`, so a concurrent manual edit wins
            await this.variationRepo.update(
                { id: link.id, mappingSource: 'derived' },
                derived,
            );
            if (link.menuItemId == null && derived.menuItemId != null) {
                newlyMappedLinkIds.push(link.id);
            }
        }
        return { newlyMappedLinkIds };
    }

    private async loadMenuItems(
        tenantId: number,
        ids: number[],
    ): Promise<Map<number, DerivationMenuItem>> {
        if (ids.length === 0) {
            return new Map();
        }
        const items = await this.menuItemRepo.find({
            where: { tenantId, id: In([...new Set(ids)]) },
            relations: { sizes: true },
            loadEagerRelations: false,
        });
        return new Map(
            items.map((item) => [
                item.id,
                {
                    id: item.id,
                    type: item.type,
                    variableMaxAmount: item.variableMaxAmount,
                    sizeIds: item.sizes.map((size) => size.id),
                },
            ]),
        );
    }
}
