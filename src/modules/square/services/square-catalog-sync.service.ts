import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Square } from 'square';
import { In, IsNull, ObjectLiteral, Repository } from 'typeorm';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { modifierEnabledFromCategories } from '../utils/square-modifier-siblings';
import { normalizeSquareName } from '../utils/square-name';
import { SquareCatalogDerivationService } from './square-catalog-derivation.service';
import { SquareConnectionService } from './square-connection.service';
import { SquareModifierPropagationService } from './square-modifier-propagation.service';

/** The catalog object types the sync reads. */
const SYNCED_OBJECT_TYPES: Square.CatalogObjectType[] = [
    'CATEGORY',
    'ITEM',
    'ITEM_VARIATION',
    'MODIFIER_LIST',
    'MODIFIER',
];

type WithId<T> = T & { id: string };

/** One sync's catalog objects, split by type; every object has an id. */
export type CatalogBatch = {
    categories: WithId<Square.CatalogObject.Category>[];
    items: WithId<Square.CatalogObject.Item>[];
    variations: WithId<Square.CatalogObject.ItemVariation>[];
    modifierLists?: WithId<Square.CatalogObject.ModifierList>[];
    /** Every modifier has `modifierData.modifierListId` set. */
    modifiers?: WithId<Square.CatalogObject.Modifier>[];
};

function hasId<T extends { id?: string }>(obj: T): obj is WithId<T> {
    return !!obj.id;
}

/**
 * Pulls the seller's catalog into the category, item-hint, size-alias,
 * variation and modifier link tables, then re-derives the tenant's `derived`
 * variation links. Runs without a request context, so the tenant comes from the
 * connection.
 *
 * Existing rows get only their Square-side fields refreshed; tenant choices
 * (`enabled`, mappings, modes, `reviewedAt`) are never touched. New hints and
 * aliases are auto-matched by exact normalized name (one candidate only). New
 * variation links start as needing review, with their category link's
 * `enabled`. New and unmapped modifier links take a mapped sibling's mapping
 * (same name, same Square item); new ones without one are auto-matched to a
 * single menu item. Deleted and archived objects are flagged, never removed.
 */
@Injectable()
export class SquareCatalogSyncService {
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
        @InjectRepository(SquareConnection)
        private readonly connectionRepo: Repository<SquareConnection>,
        private readonly connectionService: SquareConnectionService,
        private readonly derivation: SquareCatalogDerivationService,
        private readonly modifierPropagation: SquareModifierPropagationService,
    ) {}

    /** The whole catalog, including deleted objects (run on connect). */
    async fullSync(connection: SquareConnection): Promise<void> {
        await this.syncSince(connection, undefined);
    }

    /**
     * Objects changed since `beginTime` (the stored `catalogSyncedAt` cursor),
     * or the whole catalog when it's undefined. Stores Square's `latestTime`
     * as the next cursor.
     */
    async syncSince(
        connection: SquareConnection,
        beginTime: string | undefined,
    ): Promise<void> {
        const { batch, latestTime } = await this.search(connection, beginTime);
        await this.apply(connection.tenantId, batch);
        await this.derivation.deriveForTenant(connection.tenantId);
        if (latestTime) {
            await this.connectionRepo.update(
                { id: connection.id },
                { catalogSyncedAt: latestTime },
            );
            connection.catalogSyncedAt = latestTime;
        }
    }

    private async search(
        connection: SquareConnection,
        beginTime: string | undefined,
    ): Promise<{ batch: CatalogBatch; latestTime: string | undefined }> {
        const categories = new Map<
            string,
            WithId<Square.CatalogObject.Category>
        >();
        const items = new Map<string, WithId<Square.CatalogObject.Item>>();
        const variations = new Map<
            string,
            WithId<Square.CatalogObject.ItemVariation>
        >();
        const modifierLists = new Map<
            string,
            WithId<Square.CatalogObject.ModifierList>
        >();
        const modifiers = new Map<
            string,
            WithId<Square.CatalogObject.Modifier>
        >();
        const addVariation = (obj: Square.CatalogObject) => {
            if (obj.type === 'ITEM_VARIATION' && hasId(obj)) {
                variations.set(obj.id, obj);
            }
        };
        const addModifier = (obj: Square.CatalogObject, listId?: string) => {
            if (obj.type !== 'MODIFIER' || !hasId(obj)) {
                return;
            }
            const modifierListId = obj.modifierData?.modifierListId ?? listId;
            if (modifierListId) {
                modifiers.set(obj.id, {
                    ...obj,
                    modifierData: { ...obj.modifierData, modifierListId },
                });
            }
        };

        let cursor: string | undefined;
        let latestTime: string | undefined;
        do {
            const page = await this.connectionService.callTenant(
                connection,
                (api) =>
                    api.catalog.search({
                        objectTypes: SYNCED_OBJECT_TYPES,
                        includeDeletedObjects: true,
                        beginTime,
                        cursor,
                    }),
            );
            for (const obj of page.objects ?? []) {
                if (!hasId(obj)) {
                    continue;
                }
                if (obj.type === 'CATEGORY') {
                    categories.set(obj.id, obj);
                } else if (obj.type === 'ITEM') {
                    items.set(obj.id, obj);
                    // Items carry their variations inline
                    obj.itemData?.variations?.forEach(addVariation);
                } else if (obj.type === 'MODIFIER_LIST') {
                    modifierLists.set(obj.id, obj);
                    // Lists carry their modifiers inline
                    obj.modifierListData?.modifiers?.forEach((m) =>
                        addModifier(m, obj.id),
                    );
                } else if (obj.type === 'MODIFIER') {
                    addModifier(obj);
                } else {
                    addVariation(obj);
                }
            }
            latestTime = page.latestTime ?? latestTime;
            cursor = page.cursor || undefined;
        } while (cursor);

        return {
            batch: {
                categories: [...categories.values()],
                items: [...items.values()],
                variations: [...variations.values()],
                modifierLists: [...modifierLists.values()],
                modifiers: [...modifiers.values()],
            },
            latestTime,
        };
    }

    /**
     * Upserts one batch of catalog objects. Order matters: categories decide
     * new variations' `enabled`, and hints carry the item fields a variation
     * needs when its item isn't in the batch (an incremental sync). Items
     * also say which modifier lists they carry, so modifiers come last.
     */
    async apply(tenantId: number, batch: CatalogBatch): Promise<void> {
        await this.applyCategories(tenantId, batch.categories);
        await this.applyItems(tenantId, batch.items);
        await this.applyAliases(tenantId, batch.variations);
        await this.applyVariations(tenantId, batch.variations);
        const newModifierIds = await this.applyModifiers(tenantId, batch);
        await this.modifierPropagation.fillUnmappedFromSiblings(tenantId);
        await this.autoMatchModifiers(tenantId, newModifierIds);
    }

    private async applyCategories(
        tenantId: number,
        categories: CatalogBatch['categories'],
    ): Promise<void> {
        const existing = keyBy(
            await this.categoryRepo.find({ where: { tenantId } }),
            'squareCategoryId',
        );
        const inserts: Partial<SquareCategoryLink>[] = [];
        for (const category of categories) {
            const squareFields = {
                squareName: category.categoryData?.name ?? '',
            };
            const link = existing.get(category.id);
            if (link) {
                await this.updateIfChanged(
                    this.categoryRepo,
                    link,
                    squareFields,
                );
            } else {
                inserts.push({
                    tenantId,
                    squareCategoryId: category.id,
                    ...squareFields,
                    enabled: true,
                });
            }
        }
        await this.insertIgnoringConflicts(this.categoryRepo, inserts);
    }

    private async applyItems(
        tenantId: number,
        items: CatalogBatch['items'],
    ): Promise<void> {
        const existing = keyBy(
            await this.hintRepo.find({ where: { tenantId } }),
            'squareItemId',
        );
        let menuItemIdsByName: Map<string, number[]> | undefined;
        const inserts: Partial<SquareItemHint>[] = [];
        for (const item of items) {
            const data = item.itemData;
            const squareFields = {
                squareItemName: data?.name ?? '',
                squareCategoryId:
                    data?.reportingCategory?.id ??
                    data?.categories?.[0]?.id ??
                    data?.categoryId ??
                    null,
                isArchived: data?.isArchived ?? false,
                isDeleted: item.isDeleted ?? false,
            };
            const hint = existing.get(item.id);
            if (hint) {
                await this.updateIfChanged(this.hintRepo, hint, squareFields);
            } else {
                menuItemIdsByName ??= idsByName(
                    await this.menuItemRepo.find({
                        where: { tenantId },
                        select: { id: true, name: true },
                        loadEagerRelations: false,
                    }),
                );
                const candidates =
                    menuItemIdsByName.get(
                        normalizeSquareName(squareFields.squareItemName),
                    ) ?? [];
                inserts.push({
                    tenantId,
                    squareItemId: item.id,
                    ...squareFields,
                    menuItemId: candidates.length === 1 ? candidates[0] : null,
                });
            }

            // The item's name and flags also live on its variation links,
            // including variations this batch doesn't carry
            await this.variationRepo.update(
                { tenantId, squareItemId: item.id },
                {
                    squareItemName: squareFields.squareItemName,
                    isArchived: squareFields.isArchived,
                    ...(squareFields.isDeleted ? { isDeleted: true } : {}),
                },
            );
        }
        await this.insertIgnoringConflicts(this.hintRepo, inserts);
    }

    private async applyAliases(
        tenantId: number,
        variations: CatalogBatch['variations'],
    ): Promise<void> {
        const existing = keyBy(
            await this.aliasRepo.find({ where: { tenantId } }),
            'squareVariationName',
        );
        const newNames = new Set(
            variations
                .map((v) =>
                    normalizeSquareName(v.itemVariationData?.name ?? ''),
                )
                .filter((name) => name !== '' && !existing.has(name)),
        );
        if (newNames.size === 0) {
            return;
        }
        const sizeIdsByName = idsByName(
            await this.sizeRepo.find({
                where: { tenantId },
                select: { id: true, name: true },
            }),
        );
        await this.insertIgnoringConflicts(
            this.aliasRepo,
            [...newNames].map((name) => {
                const candidates = sizeIdsByName.get(name) ?? [];
                return {
                    tenantId,
                    squareVariationName: name,
                    menuItemSizeId:
                        candidates.length === 1 ? candidates[0] : null,
                };
            }),
        );
    }

    private async applyVariations(
        tenantId: number,
        variations: CatalogBatch['variations'],
    ): Promise<void> {
        if (variations.length === 0) {
            return;
        }
        const existing = keyBy(
            await this.variationRepo.find({ where: { tenantId } }),
            'squareVariationId',
        );
        const hints = keyBy(
            await this.hintRepo.find({ where: { tenantId } }),
            'squareItemId',
        );
        const categoryEnabled = new Map(
            (await this.categoryRepo.find({ where: { tenantId } })).map((c) => [
                c.squareCategoryId,
                c.enabled,
            ]),
        );

        const inserts: Partial<SquareVariationLink>[] = [];
        for (const variation of variations) {
            const link = existing.get(variation.id);
            const squareItemId =
                variation.itemVariationData?.itemId ?? link?.squareItemId;
            if (!squareItemId) {
                // A deleted variation we never saw, with no data left
                continue;
            }
            const hint = hints.get(squareItemId);
            const squareFields = {
                squareItemId,
                squareItemName: hint?.squareItemName ?? '',
                squareVariationName: variation.itemVariationData?.name ?? '',
                squareVersion: variation.version?.toString() ?? null,
                isDeleted: (variation.isDeleted ?? false) || !!hint?.isDeleted,
                isArchived: hint?.isArchived ?? false,
            };
            if (link) {
                await this.updateIfChanged(
                    this.variationRepo,
                    link,
                    squareFields,
                );
                continue;
            }
            // `true` when the item has no category, or no link for it yet
            const categoryId = hint?.squareCategoryId;
            const enabled =
                (categoryId == null
                    ? undefined
                    : categoryEnabled.get(categoryId)) ?? true;
            inserts.push({
                tenantId,
                squareVariationId: variation.id,
                ...squareFields,
                enabled,
                mappingSource: 'derived',
                modifierMode: 'none',
                reviewedAt: null,
            });
        }
        await this.insertIgnoringConflicts(this.variationRepo, inserts);
    }

    /**
     * Upserts modifier links and keeps every link's `squareItemIds` current:
     * an item in the batch restates the lists it carries (a deleted item keeps
     * its last ones), and all modifiers of one list share its item ids.
     * Returns the Square ids of the rows it inserted.
     */
    private async applyModifiers(
        tenantId: number,
        batch: CatalogBatch,
    ): Promise<string[]> {
        const lists = keyBy(batch.modifierLists ?? [], 'id');
        const modifiers = batch.modifiers ?? [];
        const listIdsByItem = new Map<string, Set<string>>();
        for (const item of batch.items) {
            if (item.isDeleted) {
                continue;
            }
            listIdsByItem.set(
                item.id,
                new Set(
                    (item.itemData?.modifierListInfo ?? [])
                        .filter((info) => info.enabled !== false)
                        .map((info) => info.modifierListId),
                ),
            );
        }
        if (
            lists.size === 0 &&
            modifiers.length === 0 &&
            listIdsByItem.size === 0
        ) {
            return [];
        }

        const existingLinks = await this.modifierRepo.find({
            where: { tenantId },
        });
        const existing = keyBy(existingLinks, 'squareModifierId');
        const storedByList = keyBy(existingLinks, 'squareModifierListId');
        const itemIdsOfList = new Map<string, string[]>();
        const itemIdsFor = (listId: string): string[] => {
            let itemIds = itemIdsOfList.get(listId);
            if (!itemIds) {
                const kept = (
                    storedByList.get(listId)?.squareItemIds ?? []
                ).filter((itemId) => !listIdsByItem.has(itemId));
                const attached = [...listIdsByItem]
                    .filter(([, listIds]) => listIds.has(listId))
                    .map(([itemId]) => itemId);
                itemIds = [...new Set([...kept, ...attached])].sort();
                itemIdsOfList.set(listId, itemIds);
            }
            return itemIds;
        };
        const listName = (listId: string): string =>
            lists.get(listId)?.modifierListData?.name ??
            storedByList.get(listId)?.squareModifierListName ??
            '';
        const listDeleted = (listId: string): boolean =>
            lists.get(listId)?.isDeleted ?? false;

        // Rows without a modifier object in the batch: their list or the
        // items carrying it may still have changed
        const inBatch = new Set(modifiers.map((m) => m.id));
        for (const link of existingLinks) {
            if (inBatch.has(link.squareModifierId)) {
                continue;
            }
            const listId = link.squareModifierListId;
            await this.updateIfChanged(this.modifierRepo, link, {
                squareModifierListName: listName(listId),
                squareItemIds: itemIdsFor(listId),
                isDeleted: link.isDeleted || listDeleted(listId),
            });
        }

        let enabledFor: ((itemIds: string[]) => boolean) | undefined;
        const inserts: Partial<SquareModifierLink>[] = [];
        for (const modifier of modifiers) {
            const listId = modifier.modifierData?.modifierListId ?? '';
            const squareFields = {
                squareModifierListId: listId,
                squareModifierListName: listName(listId),
                squareModifierName: modifier.modifierData?.name ?? '',
                squareItemIds: itemIdsFor(listId),
                isDeleted: (modifier.isDeleted ?? false) || listDeleted(listId),
            };
            const link = existing.get(modifier.id);
            if (link) {
                await this.updateIfChanged(
                    this.modifierRepo,
                    link,
                    squareFields,
                );
                continue;
            }
            enabledFor ??= await this.modifierEnabledResolver(tenantId);
            inserts.push({
                tenantId,
                squareModifierId: modifier.id,
                ...squareFields,
                enabled: enabledFor(squareFields.squareItemIds),
                kind: 'item',
                menuItemId: null,
                menuItemSizeId: null,
                mappingSource: 'derived',
                reviewedAt: null,
            });
        }
        await this.insertIgnoringConflicts(this.modifierRepo, inserts);
        return inserts.map((row) => row.squareModifierId ?? '');
    }

    /** A new modifier link's `enabled`, from its items' category links. */
    private async modifierEnabledResolver(
        tenantId: number,
    ): Promise<(itemIds: string[]) => boolean> {
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
        return (itemIds) =>
            modifierEnabledFromCategories(
                itemIds,
                categoryIdByItem,
                categoryEnabled,
            );
    }

    /**
     * New modifier links no sibling mapped: exact normalized name against the
     * tenant's `SINGLE` menu items, one candidate only. The size is filled
     * only when that item has exactly one; otherwise the link stays unmapped
     * rather than half-mapped.
     */
    private async autoMatchModifiers(
        tenantId: number,
        newModifierIds: string[],
    ): Promise<void> {
        if (newModifierIds.length === 0) {
            return;
        }
        const unmapped = await this.modifierRepo.find({
            where: {
                tenantId,
                squareModifierId: In(newModifierIds),
                kind: 'item',
                menuItemId: IsNull(),
                mappingSource: 'derived',
            },
        });
        if (unmapped.length === 0) {
            return;
        }
        const singles = await this.menuItemRepo.find({
            where: { tenantId, type: MENU_ITEM_TYPES.SINGLE },
            relations: { sizes: true },
            loadEagerRelations: false,
        });
        const byName = new Map<string, MenuItem[]>();
        for (const menuItem of singles) {
            const key = normalizeSquareName(menuItem.name);
            byName.set(key, [...(byName.get(key) ?? []), menuItem]);
        }
        for (const link of unmapped) {
            const candidates =
                byName.get(normalizeSquareName(link.squareModifierName)) ?? [];
            const sizes = candidates[0]?.sizes ?? [];
            if (candidates.length === 1 && sizes.length === 1) {
                await this.modifierRepo.update(
                    {
                        id: link.id,
                        mappingSource: 'derived',
                        menuItemId: IsNull(),
                    },
                    {
                        menuItemId: candidates[0].id,
                        menuItemSizeId: sizes[0].id,
                    },
                );
            }
        }
    }

    private async updateIfChanged<T extends ObjectLiteral & { id: number }>(
        repo: Repository<T>,
        row: T,
        fields: Partial<T>,
    ): Promise<void> {
        const changed = (Object.keys(fields) as (keyof T)[]).some(
            (key) => !sameValue(row[key], fields[key]),
        );
        if (changed) {
            await repo.update(row.id, fields);
        }
    }

    /** A concurrent sync may have inserted the same row; its row wins. */
    private async insertIgnoringConflicts<T extends ObjectLiteral>(
        repo: Repository<T>,
        rows: Partial<T>[],
    ): Promise<void> {
        if (rows.length === 0) {
            return;
        }
        await repo
            .createQueryBuilder()
            .insert()
            .values(rows)
            .orIgnore()
            .execute();
    }
}

/** Strict equality, or element-wise for arrays (`squareItemIds`). */
function sameValue(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
    }
    return a === b;
}

function keyBy<T, K extends keyof T>(rows: T[], key: K): Map<T[K], T> {
    return new Map(rows.map((row) => [row[key], row]));
}

/** Petsi ids by normalized name: the auto-match candidates. */
function idsByName(
    rows: { id: number; name: string }[],
): Map<string, number[]> {
    const byName = new Map<string, number[]>();
    for (const { id, name } of rows) {
        const key = normalizeSquareName(name);
        byName.set(key, [...(byName.get(key) ?? []), id]);
    }
    return byName;
}
