import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    SQUARE_CATALOG_VIEW,
    SquareCatalogDto,
    SquareCatalogView,
    SquareModifierLinkDto,
    SquareVariationLinkDto,
} from '../dto/square-catalog.dto';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';

/**
 * The catalog-mapping screen's reads. Scoped to the caller's tenant; rows are
 * created only by `SquareCatalogSyncService`.
 */
@Injectable()
export class SquareCatalogService {
    constructor(
        @InjectRepository(SquareCategoryLink)
        private readonly categoryRepo: Repository<SquareCategoryLink>,
        @InjectRepository(SquareItemHint)
        private readonly hintRepo: Repository<SquareItemHint>,
        @InjectRepository(SquareSizeAlias)
        private readonly aliasRepo: Repository<SquareSizeAlias>,
        @InjectRepository(SquareVariationLink)
        private readonly variationRepo: Repository<SquareVariationLink>,
        @InjectRepository(SquareModifierLink)
        private readonly modifierRepo: Repository<SquareModifierLink>,
        private readonly requestContextService: RequestContextService,
    ) {}

    /**
     * Items with their variation and modifier links. A row is hidden when
     * it's archived or deleted (a variation or modifier carries its item's
     * flags): `active` returns the others, `archived` only those, plus the
     * items they belong to.
     */
    async findCatalogForCurrentTenant(
        view: SquareCatalogView = SQUARE_CATALOG_VIEW.ACTIVE,
    ): Promise<SquareCatalogDto> {
        const tenantId = this.getTenantId();
        const [categories, aliases, hints, variations, modifiers] =
            await Promise.all([
                this.categoryRepo.find({
                    where: { tenantId },
                    order: { squareName: 'ASC', id: 'ASC' },
                }),
                this.aliasRepo.find({
                    where: { tenantId },
                    order: { squareVariationName: 'ASC', id: 'ASC' },
                }),
                this.hintRepo.find({
                    where: { tenantId },
                    order: { squareItemName: 'ASC', id: 'ASC' },
                }),
                this.variationRepo.find({
                    where: { tenantId },
                    order: { squareVariationName: 'ASC', id: 'ASC' },
                }),
                this.modifierRepo.find({
                    where: { tenantId },
                    order: {
                        squareModifierListName: 'ASC',
                        squareModifierName: 'ASC',
                        id: 'ASC',
                    },
                }),
            ]);

        const wanted = (row: { isArchived: boolean; isDeleted: boolean }) => {
            const hidden = row.isArchived || row.isDeleted;
            if (view === SQUARE_CATALOG_VIEW.ALL) {
                return true;
            }
            return view === SQUARE_CATALOG_VIEW.ARCHIVED ? hidden : !hidden;
        };

        const variationsByItem = new Map<string, SquareVariationLinkDto[]>();
        for (const link of variations.filter(wanted)) {
            variationsByItem.set(link.squareItemId, [
                ...(variationsByItem.get(link.squareItemId) ?? []),
                toVariationDto(link),
            ]);
        }

        const modifiersByItem = new Map<string, SquareModifierLinkDto[]>();
        for (const hint of hints) {
            for (const link of modifiers) {
                if (
                    link.squareItemIds.includes(hint.squareItemId) &&
                    wanted({
                        isArchived: hint.isArchived,
                        isDeleted: hint.isDeleted || link.isDeleted,
                    })
                ) {
                    modifiersByItem.set(hint.squareItemId, [
                        ...(modifiersByItem.get(hint.squareItemId) ?? []),
                        toModifierDto(link),
                    ]);
                }
            }
        }

        return {
            categories: categories.map((c) => ({
                id: c.id,
                squareCategoryId: c.squareCategoryId,
                squareName: c.squareName,
                enabled: c.enabled,
            })),
            sizeAliases: aliases.map((a) => ({
                id: a.id,
                squareVariationName: a.squareVariationName,
                menuItemSizeId: a.menuItemSizeId,
            })),
            items: hints
                .filter(
                    (hint) =>
                        wanted(hint) ||
                        variationsByItem.has(hint.squareItemId) ||
                        modifiersByItem.has(hint.squareItemId),
                )
                .map((hint) => ({
                    id: hint.id,
                    squareItemId: hint.squareItemId,
                    squareItemName: hint.squareItemName,
                    squareCategoryId: hint.squareCategoryId,
                    isArchived: hint.isArchived,
                    isDeleted: hint.isDeleted,
                    menuItemId: hint.menuItemId,
                    variations: variationsByItem.get(hint.squareItemId) ?? [],
                    modifiers: modifiersByItem.get(hint.squareItemId) ?? [],
                })),
        };
    }

    /** The caller's tenant, from the request context; never a client-supplied id. */
    private getTenantId(): number {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        return tenantId;
    }
}

export function toVariationDto(
    link: SquareVariationLink,
): SquareVariationLinkDto {
    return {
        id: link.id,
        squareVariationId: link.squareVariationId,
        squareVariationName: link.squareVariationName,
        squareVersion: link.squareVersion,
        isArchived: link.isArchived,
        isDeleted: link.isDeleted,
        enabled: link.enabled,
        menuItemId: link.menuItemId,
        menuItemSizeId: link.menuItemSizeId,
        modifierMode: link.modifierMode,
        mappingSource: link.mappingSource,
        reviewedAt: link.reviewedAt,
    };
}

export function toModifierDto(link: SquareModifierLink): SquareModifierLinkDto {
    return {
        id: link.id,
        squareModifierId: link.squareModifierId,
        squareModifierListId: link.squareModifierListId,
        squareModifierListName: link.squareModifierListName,
        squareModifierName: link.squareModifierName,
        squareItemIds: link.squareItemIds,
        isDeleted: link.isDeleted,
        enabled: link.enabled,
        kind: link.kind,
        menuItemId: link.menuItemId,
        menuItemSizeId: link.menuItemSizeId,
        mappingSource: link.mappingSource,
        reviewedAt: link.reviewedAt,
    };
}
