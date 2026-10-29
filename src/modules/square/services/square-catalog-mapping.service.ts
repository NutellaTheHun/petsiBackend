import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    MarkSquareLinksReviewedDto,
    SquareSizeAliasSuggestionDto,
    UpdateSquareModifierLinkMappingDto,
    UpdateSquareVariationLinkDto,
} from '../dto/square-catalog-mapping.dto';
import {
    SquareCategoryLinkDto,
    SquareModifierLinkDto,
    SquareSizeAliasDto,
    SquareVariationLinkDto,
} from '../dto/square-catalog.dto';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import {
    isModifierMapped,
    ModifierMapping,
    modifierEnabledFromCategories,
} from '../utils/square-modifier-siblings';
import { groupByServesText } from '../utils/square-size-suggestions';
import { SquareModifierLinkValidator } from '../validators/square-modifier-link.validator';
import {
    SquareVariationLinkValidator,
    SquareVariationMapping,
} from '../validators/square-variation-link.validator';
import { SquareCatalogDerivationService } from './square-catalog-derivation.service';
import { toModifierDto, toVariationDto } from './square-catalog.service';
import { SquareLineConversionService } from './square-line-conversion.service';
import { SquareModifierPropagationService } from './square-modifier-propagation.service';

/**
 * The catalog-mapping screen's writes. Scoped to the caller's tenant; a row in
 * another tenant is a 404. Every change that can map a variation link ends in
 * `afterMappingChange`, which re-derives `derived` links and hands newly
 * mapped ones to pending-line conversion.
 */
@Injectable()
export class SquareCatalogMappingService {
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
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
        @InjectRepository(MenuItemSize)
        private readonly sizeRepo: Repository<MenuItemSize>,
        private readonly derivation: SquareCatalogDerivationService,
        private readonly lineConversion: SquareLineConversionService,
        private readonly validator: SquareVariationLinkValidator,
        private readonly modifierValidator: SquareModifierLinkValidator,
        private readonly modifierPropagation: SquareModifierPropagationService,
        private readonly requestContextService: RequestContextService,
    ) {}

    /**
     * Sets or clears the menu item an item's derived variation links take,
     * and re-derives them. Manual links keep their mapping.
     */
    async setItemHintForCurrentTenant(
        id: number,
        menuItemId: number | null,
    ): Promise<SquareVariationLinkDto[]> {
        const hint = await this.findOrThrow(this.hintRepo, id);
        if (menuItemId != null) {
            this.enforceFound(
                await this.menuItemRepo.existsBy({
                    id: menuItemId,
                    tenantId: hint.tenantId,
                }),
                hint.id,
                menuItemId,
                'menuItemId',
            );
        }
        await this.hintRepo.update({ id: hint.id }, { menuItemId });
        await this.afterMappingChange(hint.tenantId);
        const links = await this.variationRepo.find({
            where: { tenantId: hint.tenantId, squareItemId: hint.squareItemId },
            order: { squareVariationName: 'ASC', id: 'ASC' },
        });
        return links.map(toVariationDto);
    }

    /**
     * Sets or clears the size a normalized Square variation name means, and
     * re-derives every derived link with that name.
     */
    async setSizeAliasForCurrentTenant(
        id: number,
        menuItemSizeId: number | null,
    ): Promise<SquareSizeAliasDto> {
        const alias = await this.findOrThrow(this.aliasRepo, id);
        if (menuItemSizeId != null) {
            this.enforceFound(
                await this.sizeRepo.existsBy({
                    id: menuItemSizeId,
                    tenantId: alias.tenantId,
                }),
                alias.id,
                menuItemSizeId,
                'menuItemSizeId',
            );
        }
        await this.aliasRepo.update({ id: alias.id }, { menuItemSizeId });
        await this.afterMappingChange(alias.tenantId);
        return toAliasDto({ ...alias, menuItemSizeId });
    }

    /**
     * A manual override: the link becomes `manual` (hint, alias and category
     * changes no longer touch it) and reviewed. Omitted fields keep their
     * current value; the resulting mapping is validated as a whole.
     */
    async overrideVariationLinkForCurrentTenant(
        id: number,
        dto: UpdateSquareVariationLinkDto,
    ): Promise<SquareVariationLinkDto> {
        const link = await this.findOrThrow(this.variationRepo, id);
        const mapping: SquareVariationMapping = {
            menuItemId:
                dto.menuItemId !== undefined ? dto.menuItemId : link.menuItemId,
            menuItemSizeId:
                dto.menuItemSizeId !== undefined
                    ? dto.menuItemSizeId
                    : link.menuItemSizeId,
            modifierMode: dto.modifierMode ?? link.modifierMode,
        };
        const errorMap = await this.validator.validate(link, mapping);
        if (errorMap) {
            throw new ValidationException(errorMap);
        }
        await this.variationRepo.update(
            { id: link.id },
            {
                ...mapping,
                enabled: dto.enabled ?? link.enabled,
                mappingSource: 'manual',
                reviewedAt: new Date(),
            },
        );
        const updated = await this.variationRepo.findOneByOrFail({
            id: link.id,
        });
        if (link.menuItemId == null && updated.menuItemId != null) {
            await this.lineConversion.convertForVariationLinks(
                updated.tenantId,
                [updated.id],
            );
        }
        return toVariationDto(updated);
    }

    /**
     * Hands a manual link back to derivation: its mapping comes from the item
     * hint and size alias again, and its `enabled` from its category link,
     * as if it had never been overridden.
     */
    async resetVariationLinkForCurrentTenant(
        id: number,
    ): Promise<SquareVariationLinkDto> {
        const link = await this.findOrThrow(this.variationRepo, id);
        if (link.mappingSource === 'manual') {
            await this.variationRepo.update(
                { id: link.id },
                {
                    mappingSource: 'derived',
                    enabled: await this.categoryEnabledFor(link),
                    reviewedAt: new Date(),
                },
            );
            await this.afterMappingChange(link.tenantId);
        }
        return toVariationDto(
            await this.variationRepo.findOneByOrFail({ id: link.id }),
        );
    }

    /**
     * Maps a modifier link to a menu item and size, ignores it, or clears it
     * (`kind: 'item'` with no ids). The link becomes `manual` and reviewed,
     * and the same choice goes to its non-manual siblings (same name, a list
     * on the same Square item), which are marked reviewed too. Returns the
     * link followed by the siblings it changed.
     */
    async setModifierMappingForCurrentTenant(
        id: number,
        dto: UpdateSquareModifierLinkMappingDto,
    ): Promise<SquareModifierLinkDto[]> {
        const link = await this.findOrThrow(this.modifierRepo, id);
        const mapping: ModifierMapping = {
            kind: dto.kind,
            menuItemId: dto.menuItemId ?? null,
            menuItemSizeId: dto.menuItemSizeId ?? null,
        };
        const errorMap = await this.modifierValidator.validate(link, mapping);
        if (errorMap) {
            throw new ValidationException(errorMap);
        }
        const reviewedAt = new Date();
        await this.modifierRepo.update(
            { id: link.id },
            { ...mapping, mappingSource: 'manual', reviewedAt },
        );
        const updated = await this.modifierRepo.findOneByOrFail({
            id: link.id,
        });
        const siblingIds = await this.modifierPropagation.propagateFrom(
            updated,
            reviewedAt,
        );
        if (isModifierMapped(mapping)) {
            await this.lineConversion.convertForModifierLinks(
                updated.tenantId,
                [updated.id, ...siblingIds],
            );
        }
        const siblings =
            siblingIds.length > 0
                ? await this.modifierRepo.find({
                      where: { id: In(siblingIds) },
                      order: { id: 'ASC' },
                  })
                : [];
        return [updated, ...siblings].map(toModifierDto);
    }

    /**
     * Enables or disables one modifier link. Like a variation override, it
     * makes the link `manual` (category toggles and propagation no longer
     * touch it) and reviewed; siblings are not changed.
     */
    async setModifierEnabledForCurrentTenant(
        id: number,
        enabled: boolean,
    ): Promise<SquareModifierLinkDto> {
        const link = await this.findOrThrow(this.modifierRepo, id);
        await this.modifierRepo.update(
            { id: link.id },
            { enabled, mappingSource: 'manual', reviewedAt: new Date() },
        );
        return toModifierDto(
            await this.modifierRepo.findOneByOrFail({ id: link.id }),
        );
    }

    /**
     * Enables or disables a category: its non-manual variation links follow,
     * and the catalog sync gives new links in it this `enabled`. Non-manual
     * modifier links on its items are recomputed from all their items'
     * categories (disabled only when every one is disabled).
     */
    async setCategoryEnabledForCurrentTenant(
        id: number,
        enabled: boolean,
    ): Promise<SquareCategoryLinkDto> {
        const category = await this.findOrThrow(this.categoryRepo, id);
        await this.categoryRepo.update({ id: category.id }, { enabled });
        const itemIds = (
            await this.hintRepo.find({
                where: {
                    tenantId: category.tenantId,
                    squareCategoryId: category.squareCategoryId,
                },
                select: { squareItemId: true },
            })
        ).map((hint) => hint.squareItemId);
        if (itemIds.length > 0) {
            await this.variationRepo.update(
                {
                    tenantId: category.tenantId,
                    squareItemId: In(itemIds),
                    mappingSource: 'derived',
                },
                { enabled },
            );
        }
        await this.recomputeModifierEnabled(category.tenantId, itemIds);
        return {
            id: category.id,
            squareCategoryId: category.squareCategoryId,
            squareName: category.squareName,
            enabled,
        };
    }

    /** Marks the caller's variation and modifier links as reviewed; ids from another tenant are ignored. */
    async markReviewedForCurrentTenant(
        dto: MarkSquareLinksReviewedDto,
    ): Promise<void> {
        const tenantId = this.getTenantId();
        const reviewedAt = new Date();
        if (dto.variationLinkIds?.length) {
            await this.variationRepo.update(
                {
                    tenantId,
                    id: In(dto.variationLinkIds),
                    reviewedAt: IsNull(),
                },
                { reviewedAt },
            );
        }
        if (dto.modifierLinkIds?.length) {
            await this.modifierRepo.update(
                {
                    tenantId,
                    id: In(dto.modifierLinkIds),
                    reviewedAt: IsNull(),
                },
                { reviewedAt },
            );
        }
    }

    /** Size aliases whose names differ only in their "serves N" text. */
    async findSizeAliasSuggestionsForCurrentTenant(): Promise<
        SquareSizeAliasSuggestionDto[]
    > {
        const aliases = await this.aliasRepo.find({
            where: { tenantId: this.getTenantId() },
            order: { squareVariationName: 'ASC', id: 'ASC' },
        });
        return groupByServesText(aliases, (a) => a.squareVariationName).map(
            ({ baseName, rows }) => ({
                baseName,
                aliases: rows.map(toAliasDto),
            }),
        );
    }

    /**
     * Re-derives the tenant's derived links, then converts pending lines on
     * the links that became mapped: the hook task 15 fills in.
     */
    private async afterMappingChange(tenantId: number): Promise<void> {
        const { newlyMappedLinkIds } =
            await this.derivation.deriveForTenant(tenantId);
        if (newlyMappedLinkIds.length > 0) {
            await this.lineConversion.convertForVariationLinks(
                tenantId,
                newlyMappedLinkIds,
            );
        }
    }

    /** Non-manual modifier links on these items take their categories' `enabled`. */
    private async recomputeModifierEnabled(
        tenantId: number,
        squareItemIds: string[],
    ): Promise<void> {
        if (squareItemIds.length === 0) {
            return;
        }
        const links = await this.modifierRepo
            .createQueryBuilder('m')
            .where('m.tenantId = :tenantId', { tenantId })
            .andWhere("m.mappingSource = 'derived'")
            .andWhere('m.squareItemIds && :itemIds', {
                itemIds: squareItemIds,
            })
            .getMany();
        if (links.length === 0) {
            return;
        }
        const categoryIdByItem = new Map(
            (await this.hintRepo.find({ where: { tenantId } })).map((h) => [
                h.squareItemId,
                h.squareCategoryId,
            ]),
        );
        const categoryEnabled = new Map(
            (await this.categoryRepo.find({ where: { tenantId } })).map((c) => [
                c.squareCategoryId,
                c.enabled,
            ]),
        );
        for (const enabled of [true, false]) {
            const ids = links
                .filter(
                    (link) =>
                        modifierEnabledFromCategories(
                            link.squareItemIds,
                            categoryIdByItem,
                            categoryEnabled,
                        ) === enabled && link.enabled !== enabled,
                )
                .map((link) => link.id);
            if (ids.length > 0) {
                await this.modifierRepo.update(
                    { id: In(ids), mappingSource: 'derived' },
                    { enabled },
                );
            }
        }
    }

    /** A new link's `enabled`: its category link's, or `true` without one. */
    private async categoryEnabledFor(
        link: SquareVariationLink,
    ): Promise<boolean> {
        const hint = await this.hintRepo.findOne({
            where: { tenantId: link.tenantId, squareItemId: link.squareItemId },
        });
        if (hint?.squareCategoryId == null) {
            return true;
        }
        const category = await this.categoryRepo.findOne({
            where: {
                tenantId: link.tenantId,
                squareCategoryId: hint.squareCategoryId,
            },
        });
        return category?.enabled ?? true;
    }

    /** `REFERENCE_NOT_FOUND` on `field` unless the Petsi row was found in the tenant. */
    private enforceFound(
        found: boolean,
        linkId: number,
        id: number,
        field: string,
    ): void {
        if (!found) {
            const errorMap = new ValidationErrorMap(linkId);
            errorMap.addError('REFERENCE_NOT_FOUND', undefined, [field], {
                value: id,
            });
            throw new ValidationException(errorMap);
        }
    }

    private async findOrThrow<T extends { id: number; tenantId: number }>(
        repo: Repository<T>,
        id: number,
    ): Promise<T> {
        const row = await repo.findOne({
            where: {
                id,
                tenantId: this.getTenantId(),
            } as FindOptionsWhere<T>,
        });
        if (!row) {
            throw new NotFoundException();
        }
        return row;
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

function toAliasDto(alias: SquareSizeAlias): SquareSizeAliasDto {
    return {
        id: alias.id,
        squareVariationName: alias.squareVariationName,
        menuItemSizeId: alias.menuItemSizeId,
    };
}
