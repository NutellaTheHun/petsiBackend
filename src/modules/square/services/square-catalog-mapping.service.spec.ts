import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { ValidationErrorCode } from '../../../common/validation/validation-error-codes';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { normalizeSquareName } from '../utils/square-name';
import { getSquareTestingModule } from '../utils/square-testing.module';
import {
    CatalogBatch,
    SquareCatalogSyncService,
} from './square-catalog-sync.service';
import { SquareCatalogDerivationService } from './square-catalog-derivation.service';
import { SquareCatalogMappingService } from './square-catalog-mapping.service';
import { SquareLineConversionService } from './square-line-conversion.service';

const P = `t${Date.now()}`;

// ─── Square fixtures ────────────────────────────────────────────────────────

const category = (
    id: string,
    name: string,
): CatalogBatch['categories'][number] => ({
    type: 'CATEGORY',
    id: `${P}-${id}`,
    version: 1n,
    categoryData: { name },
});

const variation = (
    id: string,
    itemId: string,
    name: string,
): CatalogBatch['variations'][number] => ({
    type: 'ITEM_VARIATION',
    id: `${P}-${id}`,
    version: 1n,
    itemVariationData: { itemId: `${P}-${itemId}`, name },
});

const item = (
    id: string,
    name: string,
    categoryId?: string,
    modifierListIds: string[] = [],
): CatalogBatch['items'][number] => ({
    type: 'ITEM',
    id: `${P}-${id}`,
    version: 1n,
    itemData: {
        name,
        reportingCategory: categoryId
            ? { id: `${P}-${categoryId}` }
            : undefined,
        modifierListInfo: modifierListIds.map((listId) => ({
            modifierListId: `${P}-${listId}`,
        })),
    },
});

const modifierList = (
    id: string,
    name: string,
): NonNullable<CatalogBatch['modifierLists']>[number] => ({
    type: 'MODIFIER_LIST',
    id: `${P}-${id}`,
    version: 1n,
    modifierListData: { name },
});

const modifier = (
    id: string,
    listId: string,
    name: string,
): NonNullable<CatalogBatch['modifiers']>[number] => ({
    type: 'MODIFIER',
    id: `${P}-${id}`,
    version: 1n,
    modifierData: { name, modifierListId: `${P}-${listId}` },
});

describe('Square catalog mapping', () => {
    let module: TestingModule;
    let mappingService: SquareCatalogMappingService;
    let syncService: SquareCatalogSyncService;
    let lineConversion: SquareLineConversionService;
    let derivation: SquareCatalogDerivationService;
    let requestContext: TestRequestContextService;
    let categoryRepo: Repository<SquareCategoryLink>;
    let hintRepo: Repository<SquareItemHint>;
    let aliasRepo: Repository<SquareSizeAlias>;
    let variationRepo: Repository<SquareVariationLink>;
    let modifierRepo: Repository<SquareModifierLink>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let large: MenuItemSize;
    let small: MenuItemSize;
    let boxSize: MenuItemSize;
    let applePie: MenuItem;
    let cherryPie: MenuItem;
    let cookieBox: MenuItem;
    let otherTenantItem: MenuItem;

    beforeAll(async () => {
        module = await getSquareTestingModule();
        mappingService = module.get(SquareCatalogMappingService);
        syncService = module.get(SquareCatalogSyncService);
        lineConversion = module.get(SquareLineConversionService);
        derivation = module.get(SquareCatalogDerivationService);
        requestContext = module.get(RequestContextService);
        categoryRepo = module.get(getRepositoryToken(SquareCategoryLink));
        hintRepo = module.get(getRepositoryToken(SquareItemHint));
        aliasRepo = module.get(getRepositoryToken(SquareSizeAlias));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        modifierRepo = module.get(getRepositoryToken(SquareModifierLink));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        const locationUtil = module.get(LocationTestUtil);
        tenant = await locationUtil.seedTenant(P);
        otherTenant = await locationUtil.seedTenant(`${P}-other`);
        [large, small, boxSize] = await sizeRepo.save([
            { tenantId: tenant.id, name: `${P} Large` },
            { tenantId: tenant.id, name: `${P} Small` },
            { tenantId: tenant.id, name: `${P} Box` },
        ]);
        [applePie, cherryPie, cookieBox] = await menuItemRepo.save([
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Apple Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [large, small],
            }),
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Cherry Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [large],
            }),
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Cookie Box`,
                type: MENU_ITEM_TYPES.CONTAINER,
                variableMaxAmount: 6,
                sizes: [boxSize],
            }),
        ]);
        otherTenantItem = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: otherTenant.id,
                name: `${P} Other Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
            }),
        );
    });

    afterAll(async () => {
        await menuItemRepo.delete({ tenantId: tenant.id });
        await menuItemRepo.delete({ tenantId: otherTenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await tenantRepo.delete([tenant.id, otherTenant.id]);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        requestContext.setContext({ tenantId: tenant.id });
        testCtx.addCleanupFunction(async () => {
            await modifierRepo.delete({ tenantId: tenant.id });
            await variationRepo.delete({ tenantId: tenant.id });
            await aliasRepo.delete({ tenantId: tenant.id });
            await hintRepo.delete({ tenantId: tenant.id });
            await categoryRepo.delete({ tenantId: tenant.id });
        });
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await testCtx.executeCleanupFunctions();
    });

    /** Apple Pie (Large, Small) in Pies; Cookie Box (Box) uncategorized. */
    async function seedCatalog(): Promise<void> {
        await syncService.apply(tenant.id, {
            categories: [category('cat-pies', `${P} Pies`)],
            items: [
                item('pie', `${P} Apple Pie`, 'cat-pies'),
                item('box', `${P} Cookie Box`),
            ],
            variations: [
                variation('pie-large', 'pie', `${P} Large`),
                variation('pie-small', 'pie', `${P} Small`),
                variation('box-6', 'box', `${P} Box`),
            ],
        });
        await derivation.deriveForTenant(tenant.id);
    }

    const findVariation = (id: string) =>
        variationRepo.findOneByOrFail({
            tenantId: tenant.id,
            squareVariationId: `${P}-${id}`,
        });
    const findHint = (id: string) =>
        hintRepo.findOneByOrFail({
            tenantId: tenant.id,
            squareItemId: `${P}-${id}`,
        });
    const findAlias = (name: string) =>
        aliasRepo.findOneByOrFail({
            tenantId: tenant.id,
            squareVariationName: normalizeSquareName(name),
        });
    const findCategory = () =>
        categoryRepo.findOneByOrFail({
            tenantId: tenant.id,
            squareCategoryId: `${P}-cat-pies`,
        });

    async function expectValidationError(
        promise: Promise<unknown>,
        errorCode: ValidationErrorCode,
        field: string,
    ): Promise<void> {
        const err = await promise.then(
            () => undefined,
            (e: unknown) => e,
        );
        expect(err).toBeInstanceOf(ValidationException);
        expectValidationErrorPayload((err as ValidationException).errors, [], {
            errorCode,
            ids: undefined,
            fields: [field],
        });
    }

    describe('item hints', () => {
        it('re-derives the item’s derived links and leaves manual ones alone', async () => {
            await seedCatalog();
            await mappingService.overrideVariationLinkForCurrentTenant(
                (await findVariation('pie-small')).id,
                { menuItemId: applePie.id, menuItemSizeId: small.id },
            );

            const links = await mappingService.setItemHintForCurrentTenant(
                (await findHint('pie')).id,
                cherryPie.id,
            );

            expect(links.map((l) => l.squareVariationId).sort()).toEqual([
                `${P}-pie-large`,
                `${P}-pie-small`,
            ]);
            expect(await findVariation('pie-large')).toMatchObject({
                menuItemId: cherryPie.id,
                menuItemSizeId: large.id,
                mappingSource: 'derived',
            });
            expect(await findVariation('pie-small')).toMatchObject({
                menuItemId: applePie.id,
                menuItemSizeId: small.id,
                mappingSource: 'manual',
            });
        });

        it('unmaps derived links when cleared, and converts lines when set again', async () => {
            await seedCatalog();
            const hint = await findHint('pie');
            await mappingService.setItemHintForCurrentTenant(hint.id, null);
            expect(await findVariation('pie-large')).toMatchObject({
                menuItemId: null,
                menuItemSizeId: null,
            });

            const convert = jest.spyOn(
                lineConversion,
                'convertForVariationLinks',
            );
            await mappingService.setItemHintForCurrentTenant(
                hint.id,
                applePie.id,
            );
            const ids = [
                (await findVariation('pie-large')).id,
                (await findVariation('pie-small')).id,
            ];
            expect(convert).toHaveBeenCalledWith(
                tenant.id,
                expect.arrayContaining(ids),
            );
        });

        it('rejects a menu item from another tenant', async () => {
            await seedCatalog();
            await expectValidationError(
                mappingService.setItemHintForCurrentTenant(
                    (await findHint('pie')).id,
                    otherTenantItem.id,
                ),
                'REFERENCE_NOT_FOUND',
                'menuItemId',
            );
        });

        it('404s for a hint that does not exist', async () => {
            await expect(
                mappingService.setItemHintForCurrentTenant(9_999_999, null),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('size aliases', () => {
        it('re-derives every derived link with that name and leaves manual ones alone', async () => {
            await seedCatalog();
            await mappingService.overrideVariationLinkForCurrentTenant(
                (await findVariation('pie-small')).id,
                { enabled: false },
            );
            const alias = await findAlias(`${P} Small`);

            // Small → Large: still one of Apple Pie's sizes
            const dto = await mappingService.setSizeAliasForCurrentTenant(
                alias.id,
                large.id,
            );
            expect(dto).toEqual({
                id: alias.id,
                squareVariationName: alias.squareVariationName,
                menuItemSizeId: large.id,
            });
            expect(await findVariation('pie-small')).toMatchObject({
                menuItemSizeId: small.id,
                mappingSource: 'manual',
            });

            await mappingService.resetVariationLinkForCurrentTenant(
                (await findVariation('pie-small')).id,
            );
            expect(await findVariation('pie-small')).toMatchObject({
                menuItemId: applePie.id,
                menuItemSizeId: large.id,
                mappingSource: 'derived',
            });

            await mappingService.setSizeAliasForCurrentTenant(alias.id, null);
            expect(await findVariation('pie-small')).toMatchObject({
                menuItemId: null,
                menuItemSizeId: null,
            });
        });

        it('rejects an unknown size', async () => {
            await seedCatalog();
            await expectValidationError(
                mappingService.setSizeAliasForCurrentTenant(
                    (await findAlias(`${P} Large`)).id,
                    9_999_999,
                ),
                'REFERENCE_NOT_FOUND',
                'menuItemSizeId',
            );
        });
    });

    describe('manual override', () => {
        it('becomes manual and reviewed, and sticks across hint changes, alias changes and re-syncs', async () => {
            await seedCatalog();
            const link = await findVariation('pie-large');

            const dto =
                await mappingService.overrideVariationLinkForCurrentTenant(
                    link.id,
                    { menuItemId: cherryPie.id, menuItemSizeId: large.id },
                );
            expect(dto).toMatchObject({
                menuItemId: cherryPie.id,
                menuItemSizeId: large.id,
                modifierMode: 'none',
                enabled: true,
                mappingSource: 'manual',
            });
            expect(dto.reviewedAt).toBeInstanceOf(Date);

            await mappingService.setItemHintForCurrentTenant(
                (await findHint('pie')).id,
                null,
            );
            await mappingService.setSizeAliasForCurrentTenant(
                (await findAlias(`${P} Large`)).id,
                null,
            );
            await syncService.apply(tenant.id, {
                categories: [],
                items: [item('pie', `${P} Apple Pie Renamed`, 'cat-pies')],
                variations: [variation('pie-large', 'pie', `${P} Large`)],
            });

            expect(await findVariation('pie-large')).toMatchObject({
                squareItemName: `${P} Apple Pie Renamed`,
                menuItemId: cherryPie.id,
                menuItemSizeId: large.id,
                mappingSource: 'manual',
            });
        });

        it('reset re-derives the link and takes enabled from its category', async () => {
            await seedCatalog();
            await mappingService.setCategoryEnabledForCurrentTenant(
                (await findCategory()).id,
                false,
            );
            const link = await findVariation('pie-large');
            await mappingService.overrideVariationLinkForCurrentTenant(
                link.id,
                {
                    menuItemId: cherryPie.id,
                    menuItemSizeId: large.id,
                    enabled: true,
                },
            );

            const dto = await mappingService.resetVariationLinkForCurrentTenant(
                link.id,
            );
            expect(dto).toMatchObject({
                menuItemId: applePie.id,
                menuItemSizeId: large.id,
                mappingSource: 'derived',
                enabled: false,
            });
        });

        it('converts lines when it maps an unmapped link', async () => {
            await seedCatalog();
            const hint = await findHint('pie');
            await mappingService.setItemHintForCurrentTenant(hint.id, null);
            const link = await findVariation('pie-large');
            const convert = jest.spyOn(
                lineConversion,
                'convertForVariationLinks',
            );

            await mappingService.overrideVariationLinkForCurrentTenant(
                link.id,
                { menuItemId: cherryPie.id, menuItemSizeId: large.id },
            );
            expect(convert).toHaveBeenCalledWith(tenant.id, [link.id]);
        });

        it('accepts container_contents on a variable container', async () => {
            await seedCatalog();
            const dto =
                await mappingService.overrideVariationLinkForCurrentTenant(
                    (await findVariation('box-6')).id,
                    {
                        menuItemId: cookieBox.id,
                        menuItemSizeId: boxSize.id,
                        modifierMode: 'container_contents',
                    },
                );
            expect(dto.modifierMode).toBe('container_contents');
        });

        it('rejects container_contents on a non-variable-container item', async () => {
            await seedCatalog();
            const link = await findVariation('pie-large');
            await expectValidationError(
                mappingService.overrideVariationLinkForCurrentTenant(link.id, {
                    modifierMode: 'container_contents',
                }),
                'INCONSISTENT_STATE',
                'modifierMode',
            );
            expect((await findVariation('pie-large')).mappingSource).toBe(
                'derived',
            );
        });

        it('rejects a size the chosen menu item is not offered in', async () => {
            await seedCatalog();
            await expectValidationError(
                mappingService.overrideVariationLinkForCurrentTenant(
                    (await findVariation('pie-large')).id,
                    { menuItemId: cherryPie.id, menuItemSizeId: small.id },
                ),
                'INVALID_REFERENCE',
                'menuItemSizeId',
            );
        });

        it('rejects a menu item without a size', async () => {
            await seedCatalog();
            await expectValidationError(
                mappingService.overrideVariationLinkForCurrentTenant(
                    (await findVariation('pie-large')).id,
                    { menuItemId: cherryPie.id, menuItemSizeId: null },
                ),
                'MISSING_PROPERTY',
                'menuItemSizeId',
            );
        });

        it('rejects a menu item from another tenant', async () => {
            await seedCatalog();
            await expectValidationError(
                mappingService.overrideVariationLinkForCurrentTenant(
                    (await findVariation('pie-large')).id,
                    { menuItemId: otherTenantItem.id },
                ),
                'REFERENCE_NOT_FOUND',
                'menuItemId',
            );
        });

        it('404s for a link in another tenant', async () => {
            await seedCatalog();
            const link = await findVariation('pie-large');
            requestContext.setContext({ tenantId: otherTenant.id });
            await expect(
                mappingService.overrideVariationLinkForCurrentTenant(link.id, {
                    enabled: false,
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('category toggle', () => {
        it('disables its non-manual links, and new links in it start disabled', async () => {
            await seedCatalog();
            await mappingService.overrideVariationLinkForCurrentTenant(
                (await findVariation('pie-small')).id,
                { enabled: true },
            );
            const pies = await findCategory();

            const dto = await mappingService.setCategoryEnabledForCurrentTenant(
                pies.id,
                false,
            );
            expect(dto.enabled).toBe(false);
            expect((await findVariation('pie-large')).enabled).toBe(false);
            expect((await findVariation('pie-small')).enabled).toBe(true);
            // Uncategorized
            expect((await findVariation('box-6')).enabled).toBe(true);

            await syncService.apply(tenant.id, {
                categories: [],
                items: [],
                variations: [variation('pie-xl', 'pie', `${P} Extra Large`)],
            });
            expect((await findVariation('pie-xl')).enabled).toBe(false);

            await mappingService.setCategoryEnabledForCurrentTenant(
                pies.id,
                true,
            );
            expect((await findVariation('pie-large')).enabled).toBe(true);
            expect((await findVariation('pie-xl')).enabled).toBe(true);
        });
    });

    describe('review', () => {
        it("marks the caller's links as reviewed", async () => {
            await seedCatalog();
            const link = await findVariation('pie-large');
            await mappingService.markReviewedForCurrentTenant({
                variationLinkIds: [link.id],
            });

            expect(
                (await findVariation('pie-large')).reviewedAt,
            ).toBeInstanceOf(Date);
            expect((await findVariation('pie-small')).reviewedAt).toBeNull();
        });

        it("ignores another tenant's links", async () => {
            await seedCatalog();
            const link = await findVariation('pie-large');
            requestContext.setContext({ tenantId: otherTenant.id });
            await mappingService.markReviewedForCurrentTenant({
                variationLinkIds: [link.id],
            });

            expect((await findVariation('pie-large')).reviewedAt).toBeNull();
        });
    });

    describe('modifier links', () => {
        /**
         * A cookie box with one modifier list per slot (3 slots x 2 flavors),
         * and a muffin box (in Pies) whose own list has a same-named flavor.
         */
        async function seedBoxes(): Promise<void> {
            const slots = ['slot-1', 'slot-2', 'slot-3'];
            await syncService.apply(tenant.id, {
                categories: [category('cat-pies', `${P} Pies`)],
                items: [
                    item('cbox', `${P} Box of 6 Cookies`, undefined, slots),
                    item('mbox', `${P} Box of 6 Muffins`, 'cat-pies', [
                        'm-slot',
                    ]),
                    item('scone', `${P} Scone`),
                ],
                variations: [
                    variation('cbox-6', 'cbox', `${P} Box`),
                    variation('scone-reg', 'scone', ''),
                ],
                modifierLists: [
                    ...slots.map((slot, i) =>
                        modifierList(slot, `Cookie ${i + 1}`),
                    ),
                    modifierList('m-slot', 'Muffin 1'),
                ],
                modifiers: [
                    ...slots.flatMap((slot) => [
                        modifier(`${slot}-cc`, slot, 'Chocolate Chip'),
                        modifier(`${slot}-sugar`, slot, 'Sugar'),
                    ]),
                    modifier('m-slot-cc', 'm-slot', 'chocolate chip'),
                ],
            });
        }

        const findModifier = (id: string) =>
            modifierRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareModifierId: `${P}-${id}`,
            });
        const mapping = (link: SquareModifierLink) => ({
            kind: link.kind,
            menuItemId: link.menuItemId,
            menuItemSizeId: link.menuItemSizeId,
        });
        const cherryLarge = () => ({
            kind: 'item' as const,
            menuItemId: cherryPie.id,
            menuItemSizeId: large.id,
        });

        it('mapping a flavor in one slot maps it in every slot of that box, and not on another item', async () => {
            await seedBoxes();
            const convert = jest.spyOn(
                lineConversion,
                'convertForModifierLinks',
            );
            const slot1 = await findModifier('slot-1-cc');

            const dtos =
                await mappingService.setModifierMappingForCurrentTenant(
                    slot1.id,
                    cherryLarge(),
                );

            const slot2 = await findModifier('slot-2-cc');
            const slot3 = await findModifier('slot-3-cc');
            expect(dtos.map((d) => d.id)).toEqual([
                slot1.id,
                slot2.id,
                slot3.id,
            ]);
            const mapped = await findModifier('slot-1-cc');
            expect(mapped).toMatchObject({
                ...cherryLarge(),
                mappingSource: 'manual',
            });
            expect(mapped.reviewedAt).toBeInstanceOf(Date);
            for (const sibling of [slot2, slot3]) {
                expect(sibling).toMatchObject({
                    ...cherryLarge(),
                    mappingSource: 'derived',
                });
                expect(sibling.reviewedAt).toBeInstanceOf(Date);
            }
            // Other flavors and the same flavor on the muffin box are untouched
            expect(mapping(await findModifier('slot-2-sugar'))).toEqual({
                kind: 'item',
                menuItemId: null,
                menuItemSizeId: null,
            });
            expect(await findModifier('m-slot-cc')).toMatchObject({
                menuItemId: null,
                reviewedAt: null,
            });
            expect(convert).toHaveBeenCalledWith(tenant.id, [
                slot1.id,
                slot2.id,
                slot3.id,
            ]);
        });

        it('does not overwrite manual siblings', async () => {
            await seedBoxes();
            const slot2 = await findModifier('slot-2-cc');
            await mappingService.setModifierMappingForCurrentTenant(slot2.id, {
                kind: 'item',
                menuItemId: applePie.id,
                menuItemSizeId: small.id,
            });

            await mappingService.setModifierMappingForCurrentTenant(
                (await findModifier('slot-1-cc')).id,
                cherryLarge(),
            );

            expect(await findModifier('slot-2-cc')).toMatchObject({
                menuItemId: applePie.id,
                menuItemSizeId: small.id,
                mappingSource: 'manual',
            });
            expect((await findModifier('slot-3-cc')).menuItemId).toBe(
                cherryPie.id,
            );
        });

        it('propagates ignore and clear, and ignored modifiers stay ignored across re-syncs', async () => {
            await seedBoxes();
            const slot1 = await findModifier('slot-1-sugar');
            await mappingService.setModifierMappingForCurrentTenant(slot1.id, {
                kind: 'ignore',
            });
            for (const slot of ['slot-1', 'slot-2', 'slot-3']) {
                expect((await findModifier(`${slot}-sugar`)).kind).toBe(
                    'ignore',
                );
            }

            await seedBoxes();
            expect((await findModifier('slot-2-sugar')).kind).toBe('ignore');

            await mappingService.setModifierMappingForCurrentTenant(slot1.id, {
                kind: 'item',
                menuItemId: null,
            });
            expect(mapping(await findModifier('slot-3-sugar'))).toEqual({
                kind: 'item',
                menuItemId: null,
                menuItemSizeId: null,
            });
        });

        it('rejects a container menu item', async () => {
            await seedBoxes();
            await expectValidationError(
                mappingService.setModifierMappingForCurrentTenant(
                    (await findModifier('slot-1-cc')).id,
                    {
                        kind: 'item',
                        menuItemId: cookieBox.id,
                        menuItemSizeId: boxSize.id,
                    },
                ),
                'INVALID_REFERENCE',
                'menuItemId',
            );
        });

        it('rejects a size the menu item is not offered in, or no size', async () => {
            await seedBoxes();
            const link = await findModifier('slot-1-cc');
            await expectValidationError(
                mappingService.setModifierMappingForCurrentTenant(link.id, {
                    kind: 'item',
                    menuItemId: cherryPie.id,
                    menuItemSizeId: small.id,
                }),
                'INVALID_REFERENCE',
                'menuItemSizeId',
            );
            await expectValidationError(
                mappingService.setModifierMappingForCurrentTenant(link.id, {
                    kind: 'item',
                    menuItemId: cherryPie.id,
                }),
                'MISSING_PROPERTY',
                'menuItemSizeId',
            );
            expect((await findModifier('slot-1-cc')).menuItemId).toBeNull();
        });

        it('04s for a link in another tenant', async () => {
            await seedBoxes();
            const link = await findModifier('slot-1-cc');
            requestContext.setContext({ tenantId: otherTenant.id });
            await expect(
                mappingService.setModifierMappingForCurrentTenant(link.id, {
                    kind: 'ignore',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('disabling one makes it manual and leaves its siblings alone', async () => {
            await seedBoxes();
            const link = await findModifier('slot-1-cc');
            const dto = await mappingService.setModifierEnabledForCurrentTenant(
                link.id,
                false,
            );
            expect(dto).toMatchObject({
                enabled: false,
                mappingSource: 'manual',
            });
            expect((await findModifier('slot-2-cc')).enabled).toBe(true);
        });

        it('a category toggle follows the items the list is attached to', async () => {
            await seedBoxes();
            const pies = await findCategory();
            await mappingService.setCategoryEnabledForCurrentTenant(
                pies.id,
                false,
            );
            expect((await findModifier('m-slot-cc')).enabled).toBe(false);
            // The cookie box is uncategorized
            expect((await findModifier('slot-1-cc')).enabled).toBe(true);

            // New modifiers on the muffin box start disabled
            await syncService.apply(tenant.id, {
                categories: [],
                items: [],
                variations: [],
                modifiers: [modifier('m-slot-blue', 'm-slot', 'Blueberry')],
            });
            expect(await findModifier('m-slot-blue')).toMatchObject({
                enabled: false,
                squareModifierListName: 'Muffin 1',
                squareItemIds: [`${P}-mbox`],
            });

            await mappingService.setCategoryEnabledForCurrentTenant(
                pies.id,
                true,
            );
            expect((await findModifier('m-slot-cc')).enabled).toBe(true);
        });

        it('marks modifier links as reviewed', async () => {
            await seedBoxes();
            const link = await findModifier('slot-1-cc');
            await mappingService.markReviewedForCurrentTenant({
                modifierLinkIds: [link.id],
            });
            expect((await findModifier('slot-1-cc')).reviewedAt).toBeInstanceOf(
                Date,
            );
            expect((await findModifier('slot-2-cc')).reviewedAt).toBeNull();
        });

        describe('modifier_is_item on a variation', () => {
            it('is rejected when the item has no modifier lists', async () => {
                await seedBoxes();
                await syncService.apply(tenant.id, {
                    categories: [],
                    items: [item('scone', `${P} Scone`)],
                    variations: [],
                });
                await expectValidationError(
                    mappingService.overrideVariationLinkForCurrentTenant(
                        (await findVariation('scone-reg')).id,
                        { modifierMode: 'modifier_is_item' },
                    ),
                    'INCONSISTENT_STATE',
                    'modifierMode',
                );
                expect((await findVariation('scone-reg')).modifierMode).toBe(
                    'none',
                );
            });

            it('is accepted when the item has a modifier list', async () => {
                await seedBoxes();
                await syncService.apply(tenant.id, {
                    categories: [],
                    items: [item('scone', `${P} Scone`, undefined, ['glaze'])],
                    variations: [],
                    modifierLists: [modifierList('glaze', 'Glaze')],
                    modifiers: [modifier('glaze-lemon', 'glaze', 'Lemon')],
                });
                const dto =
                    await mappingService.overrideVariationLinkForCurrentTenant(
                        (await findVariation('scone-reg')).id,
                        { modifierMode: 'modifier_is_item' },
                    );
                expect(dto.modifierMode).toBe('modifier_is_item');
            });
        });
    });

    describe('size-alias suggestions', () => {
        it('groups aliases that differ only in their "serves N" text', async () => {
            await syncService.apply(tenant.id, {
                categories: [],
                items: [item('cake', `${P} Cake`)],
                variations: [
                    variation('cake-a', 'cake', `${P} Large 10" serves 8-10`),
                    variation('cake-b', 'cake', `${P} Large 10" serves 10-12`),
                    variation('cake-c', 'cake', `${P} Small 6"`),
                ],
            });

            const suggestions =
                await mappingService.findSizeAliasSuggestionsForCurrentTenant();
            expect(suggestions).toEqual([
                {
                    baseName: normalizeSquareName(`${P} Large 10"`),
                    aliases: [
                        expect.objectContaining({
                            squareVariationName: normalizeSquareName(
                                `${P} Large 10" serves 10-12`,
                            ),
                        }),
                        expect.objectContaining({
                            squareVariationName: normalizeSquareName(
                                `${P} Large 10" serves 8-10`,
                            ),
                        }),
                    ],
                },
            ]);
        });
    });
});
