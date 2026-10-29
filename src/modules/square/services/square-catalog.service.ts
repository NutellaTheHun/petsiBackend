import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    SQUARE_CATALOG_VIEW,
    SquareCatalogDto,
    SquareCatalogView,
    SquareVariationLinkDto,
} from '../dto/square-catalog.dto';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
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
        private readonly requestContextService: RequestContextService,
    ) {}

    /**
     * Items with their variation links. A row is hidden when it's archived or
     * deleted (a variation carries its item's flags): `active` returns the
     * others, `archived` only those, plus the items they belong to.
     */
    async findCatalogForCurrentTenant(
        view: SquareCatalogView = SQUARE_CATALOG_VIEW.ACTIVE,
    ): Promise<SquareCatalogDto> {
        const tenantId = this.getTenantId();
        const [categories, aliases, hints, variations] = await Promise.all([
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
                        wanted(hint) || variationsByItem.has(hint.squareItemId),
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

function toVariationDto(link: SquareVariationLink): SquareVariationLinkDto {
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
