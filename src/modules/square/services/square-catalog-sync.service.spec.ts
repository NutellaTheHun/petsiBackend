import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { normalizeSquareName } from '../utils/square-name';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';
import { SquareCatalogSyncService } from './square-catalog-sync.service';
import { SquareCatalogService } from './square-catalog.service';

const P = `t${Date.now()}`;

// ─── Square fixtures ────────────────────────────────────────────────────────

const category = (id: string, name: string): Square.CatalogObject => ({
    type: 'CATEGORY',
    id: `${P}-${id}`,
    version: 1n,
    categoryData: { name },
});

const variation = (
    id: string,
    itemId: string,
    name: string,
    overrides: Partial<Square.CatalogObject.ItemVariation> = {},
): Square.CatalogObject => ({
    type: 'ITEM_VARIATION',
    id: `${P}-${id}`,
    version: 1n,
    itemVariationData: {
        itemId: `${P}-${itemId}`,
        name,
        pricingType: 'FIXED_PRICING',
        priceMoney: { amount: 1250n, currency: 'USD' },
    },
    ...overrides,
});

const item = (
    id: string,
    name: string,
    opts: {
        categoryId?: string;
        variations: Square.CatalogObject[];
        isArchived?: boolean;
        isDeleted?: boolean;
        modifierListIds?: string[];
    },
): Square.CatalogObject => ({
    type: 'ITEM',
    id: `${P}-${id}`,
    version: 1n,
    isDeleted: opts.isDeleted ?? false,
    itemData: {
        name,
        reportingCategory: opts.categoryId
            ? { id: `${P}-${opts.categoryId}` }
            : undefined,
        isArchived: opts.isArchived ?? false,
        variations: opts.variations,
        modifierListInfo: opts.modifierListIds?.map((listId) => ({
            modifierListId: `${P}-${listId}`,
        })),
    },
});

const modifier = (
    id: string,
    listId: string,
    name: string,
    overrides: Partial<Square.CatalogObject.Modifier> = {},
): Square.CatalogObject => ({
    type: 'MODIFIER',
    id: `${P}-${id}`,
    version: 1n,
    modifierData: { name, modifierListId: `${P}-${listId}` },
    ...overrides,
});

/** A list with its modifiers inline, as `catalog.search` returns it. */
const modifierList = (
    id: string,
    name: string,
    modifiers: Square.CatalogObject[],
    overrides: Partial<Square.CatalogObject.ModifierList> = {},
): Square.CatalogObject => ({
    type: 'MODIFIER_LIST',
    id: `${P}-${id}`,
    version: 1n,
    modifierListData: { name, modifiers },
    ...overrides,
});

describe('Square catalog sync', () => {
    let module: TestingModule;
    let fake: FakeSquareClientFactory;
    let syncService: SquareCatalogSyncService;
    let catalogService: SquareCatalogService;
    let requestContext: TestRequestContextService;
    let categoryRepo: Repository<SquareCategoryLink>;
    let hintRepo: Repository<SquareItemHint>;
    let aliasRepo: Repository<SquareSizeAlias>;
    let variationRepo: Repository<SquareVariationLink>;
    let modifierRepo: Repository<SquareModifierLink>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let connectionRepo: Repository<SquareConnection>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let connection: SquareConnection;
    let large: MenuItemSize;
    let small: MenuItemSize;
    let boxSize: MenuItemSize;
    let applePie: MenuItem;
    let cookieBox: MenuItem;
    let chocolateChip: MenuItem;

    beforeAll(async () => {
        module = await getSquareTestingModule();
        fake = module.get(SquareClientFactory);
        syncService = module.get(SquareCatalogSyncService);
        catalogService = module.get(SquareCatalogService);
        requestContext = module.get(RequestContextService);
        categoryRepo = module.get(getRepositoryToken(SquareCategoryLink));
        hintRepo = module.get(getRepositoryToken(SquareItemHint));
        aliasRepo = module.get(getRepositoryToken(SquareSizeAlias));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        modifierRepo = module.get(getRepositoryToken(SquareModifierLink));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        tenant = await module.get(LocationTestUtil).seedTenant(P);
        [large, small, boxSize] = await sizeRepo.save([
            { tenantId: tenant.id, name: `${P} Large` },
            { tenantId: tenant.id, name: `${P} Small` },
            { tenantId: tenant.id, name: `${P} Box` },
        ]);
        applePie = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Apple Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [large, small],
            }),
        );
        cookieBox = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Cookie Box`,
                type: MENU_ITEM_TYPES.CONTAINER,
                variableMaxAmount: 6,
                sizes: [boxSize],
            }),
        );
        chocolateChip = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Chocolate Chip`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [small],
            }),
        );
        // Two menu items with the same normalized name: never auto-matched
        await menuItemRepo.save([
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Twin`,
                sizes: [large],
            }),
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P}  twin `,
                sizes: [large],
            }),
        ]);
        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id);
    });

    afterAll(async () => {
        await menuItemRepo.delete({ tenantId: tenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await connectionRepo.delete(connection.id);
        await tenantRepo.delete(tenant.id);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
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
        await testCtx.executeCleanupFunctions();
    });

    /** One `catalog.search` page per array; returns the requests made. */
    function stubCatalog(
        ...pages: Square.CatalogObject[][]
    ): Square.SearchCatalogObjectsRequest[] {
        const requests: Square.SearchCatalogObjectsRequest[] = [];
        fake.tenantApi.catalog.search = (req) => {
            requests.push(req);
            const index = req.cursor ? Number(req.cursor) : 0;
            return Promise.resolve({
                objects: pages[index],
                cursor:
                    index + 1 < pages.length ? String(index + 1) : undefined,
                latestTime: '2026-10-28T12:00:00.000Z',
            });
        };
        return requests;
    }

    const pies = () => category('cat-pies', `${P} Pies`);
    const pie = (extra: Square.CatalogObject[] = []) =>
        item('pie', `${P} Apple Pie`, {
            categoryId: 'cat-pies',
            variations: [
                variation('pie-large', 'pie', `${P}  LARGE`),
                // The size exists, but isn't one of the pie's sizes
                variation('pie-box', 'pie', `${P} Box`),
                ...extra,
            ],
        });
    const box = () =>
        item('box', `${P} Cookie Box`, {
            variations: [variation('box-6', 'box', `${P} Box`)],
        });

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

    it('creates category, item-hint, size-alias and variation-link rows and stores the cursor', async () => {
        const requests = stubCatalog([pies(), pie(), box()]);
        await syncService.fullSync(connection);

        expect(requests[0]).toMatchObject({ includeDeletedObjects: true });
        expect(requests[0].beginTime).toBeUndefined();

        expect(
            await categoryRepo.findBy({ tenantId: tenant.id }),
        ).toMatchObject([
            { squareCategoryId: `${P}-cat-pies`, squareName: `${P} Pies` },
        ]);
        expect(await findHint('pie')).toMatchObject({
            squareItemName: `${P} Apple Pie`,
            squareCategoryId: `${P}-cat-pies`,
            menuItemId: applePie.id,
            isArchived: false,
            isDeleted: false,
        });
        expect(await findHint('box')).toMatchObject({
            squareCategoryId: null,
            menuItemId: cookieBox.id,
        });
        // One alias per distinct normalized name, auto-matched to a size
        expect(
            await aliasRepo.find({
                where: { tenantId: tenant.id },
                order: { squareVariationName: 'ASC' },
            }),
        ).toMatchObject([
            {
                squareVariationName: normalizeSquareName(`${P} Box`),
                menuItemSizeId: boxSize.id,
            },
            {
                squareVariationName: normalizeSquareName(`${P} Large`),
                menuItemSizeId: large.id,
            },
        ]);
        expect(await findVariation('pie-large')).toMatchObject({
            squareItemId: `${P}-pie`,
            squareItemName: `${P} Apple Pie`,
            squareVariationName: `${P}  LARGE`,
            squareVersion: '1',
            enabled: true,
            mappingSource: 'derived',
            reviewedAt: null,
        });
        expect(await variationRepo.countBy({ tenantId: tenant.id })).toBe(3);

        const stored = await connectionRepo.findOneByOrFail({
            id: connection.id,
        });
        expect(stored.catalogSyncedAt).toBe('2026-10-28T12:00:00.000Z');
    });

    it('reads every page of the search', async () => {
        const requests = stubCatalog([pies(), pie()], [box()]);
        await syncService.fullSync(connection);

        expect(requests.map((r) => r.cursor)).toEqual([undefined, '1']);
        expect(await findVariation('box-6')).toBeDefined();
    });

    describe('derivation', () => {
        it('maps item and size when the size is valid for the item, and leaves them empty when it is not', async () => {
            stubCatalog([pies(), pie()]);
            await syncService.fullSync(connection);

            expect(await findVariation('pie-large')).toMatchObject({
                menuItemId: applePie.id,
                menuItemSizeId: large.id,
                modifierMode: 'none',
            });
            expect(await findVariation('pie-box')).toMatchObject({
                menuItemId: null,
                menuItemSizeId: null,
            });
        });

        it('leaves a variation unmapped when its item name has several candidates', async () => {
            stubCatalog([
                item('twin', `${P} Twin`, {
                    variations: [variation('twin-large', 'twin', `${P} Large`)],
                }),
            ]);
            await syncService.fullSync(connection);

            expect((await findHint('twin')).menuItemId).toBeNull();
            expect(await findVariation('twin-large')).toMatchObject({
                menuItemId: null,
                menuItemSizeId: null,
            });
        });

        it('lets two Square items with the same name hint the same menu item', async () => {
            stubCatalog([
                pie(),
                item('pie-2', `${P} apple pie`, {
                    variations: [
                        variation('pie-2-large', 'pie-2', `${P} Large`),
                    ],
                }),
            ]);
            await syncService.fullSync(connection);

            expect((await findHint('pie')).menuItemId).toBe(applePie.id);
            expect((await findHint('pie-2')).menuItemId).toBe(applePie.id);
            expect((await findVariation('pie-2-large')).menuItemId).toBe(
                applePie.id,
            );
        });

        it("defaults a variable container's variations to container_contents", async () => {
            stubCatalog([box()]);
            await syncService.fullSync(connection);

            expect(await findVariation('box-6')).toMatchObject({
                menuItemId: cookieBox.id,
                menuItemSizeId: boxSize.id,
                modifierMode: 'container_contents',
            });
        });
    });

    it("doesn't overwrite manual links or tenant-set fields on re-sync", async () => {
        stubCatalog([pies(), pie(), box()]);
        await syncService.fullSync(connection);

        // Tenant choices
        const reviewedAt = new Date('2026-10-01T00:00:00.000Z');
        await categoryRepo.update(
            { tenantId: tenant.id, squareCategoryId: `${P}-cat-pies` },
            { enabled: false },
        );
        const boxLink = await findVariation('box-6');
        await variationRepo.update(boxLink.id, {
            mappingSource: 'manual',
            menuItemId: applePie.id,
            menuItemSizeId: small.id,
            modifierMode: 'none',
            enabled: false,
            reviewedAt,
        });
        const largeLink = await findVariation('pie-large');
        await variationRepo.update(largeLink.id, {
            enabled: false,
            reviewedAt,
        });
        // Re-point the "large" alias to small: the derived link follows
        await aliasRepo.update(
            { id: (await findAlias(`${P} Large`)).id },
            { menuItemSizeId: small.id },
        );
        // Unmap the box hint: the manual link must not follow
        await hintRepo.update(
            { id: (await findHint('box')).id },
            { menuItemId: null },
        );

        // Square renames things and bumps versions
        stubCatalog([
            category('cat-pies', `${P} Pies Renamed`),
            item('pie', `${P} Apple Pie Renamed`, {
                categoryId: 'cat-pies',
                variations: [
                    variation('pie-large', 'pie', `${P}  LARGE`, {
                        version: 2n,
                    }),
                    variation('pie-box', 'pie', `${P} Box`),
                ],
            }),
            box(),
        ]);
        await syncService.fullSync(connection);

        expect(
            await categoryRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareCategoryId: `${P}-cat-pies`,
            }),
        ).toMatchObject({ squareName: `${P} Pies Renamed`, enabled: false });
        // The hint keeps its menu item although the name no longer matches
        expect(await findHint('pie')).toMatchObject({
            squareItemName: `${P} Apple Pie Renamed`,
            menuItemId: applePie.id,
        });
        expect((await findHint('box')).menuItemId).toBeNull();
        expect((await findAlias(`${P} Large`)).menuItemSizeId).toBe(small.id);

        expect(await findVariation('pie-large')).toMatchObject({
            squareItemName: `${P} Apple Pie Renamed`,
            squareVersion: '2',
            enabled: false,
            reviewedAt,
            mappingSource: 'derived',
            menuItemId: applePie.id,
            menuItemSizeId: small.id,
        });
        expect(await findVariation('box-6')).toMatchObject({
            mappingSource: 'manual',
            menuItemId: applePie.id,
            menuItemSizeId: small.id,
            modifierMode: 'none',
            enabled: false,
            reviewedAt,
        });
    });

    it('starts new variations in a disabled category disabled and others enabled, all needing review', async () => {
        stubCatalog([pies(), category('cat-off', `${P} Off`), pie()]);
        await syncService.fullSync(connection);
        await categoryRepo.update(
            { tenantId: tenant.id, squareCategoryId: `${P}-cat-off` },
            { enabled: false },
        );

        stubCatalog([
            pies(),
            category('cat-off', `${P} Off`),
            pie([variation('pie-small', 'pie', `${P} Small`)]),
            item('scone', `${P} Scone`, {
                categoryId: 'cat-off',
                variations: [variation('scone-reg', 'scone', 'Regular')],
            }),
        ]);
        await syncService.fullSync(connection);

        expect(await findVariation('scone-reg')).toMatchObject({
            enabled: false,
            reviewedAt: null,
        });
        expect(await findVariation('pie-small')).toMatchObject({
            enabled: true,
            reviewedAt: null,
            menuItemId: applePie.id,
            menuItemSizeId: small.id,
        });
        // The variation that existed before the toggle keeps its value
        expect((await findVariation('pie-large')).enabled).toBe(true);
    });

    describe('archived and deleted objects', () => {
        beforeEach(async () => {
            stubCatalog([
                pie([
                    variation('pie-gone', 'pie', `${P} Small`, {
                        isDeleted: true,
                    }),
                ]),
                item('old', `${P} Old Pie`, {
                    isArchived: true,
                    variations: [variation('old-large', 'old', `${P} Large`)],
                }),
                item('dead', `${P} Dead Pie`, {
                    isDeleted: true,
                    variations: [variation('dead-large', 'dead', `${P} Large`)],
                }),
            ]);
            await syncService.fullSync(connection);
        });

        it('flags them and keeps them', async () => {
            expect(await findVariation('pie-gone')).toMatchObject({
                isDeleted: true,
                isArchived: false,
            });
            expect(await findHint('old')).toMatchObject({ isArchived: true });
            expect(await findVariation('old-large')).toMatchObject({
                isArchived: true,
                isDeleted: false,
            });
            expect(await findHint('dead')).toMatchObject({ isDeleted: true });
            expect((await findVariation('dead-large')).isDeleted).toBe(true);
        });

        it('flags the variations of an item deleted later, even when Square omits them', async () => {
            // A deleted item comes back without its variations
            stubCatalog([
                item('pie', `${P} Apple Pie`, {
                    isDeleted: true,
                    variations: [],
                }),
            ]);
            await syncService.syncSince(connection, '2026-10-28T12:00:00.000Z');

            expect((await findHint('pie')).isDeleted).toBe(true);
            expect((await findVariation('pie-large')).isDeleted).toBe(true);
        });

        it('hides them by default and lists only them on request', async () => {
            const active = await catalogService.findCatalogForCurrentTenant();
            expect(active.items.map((i) => i.squareItemId)).toEqual([
                `${P}-pie`,
            ]);
            expect(
                active.items[0].variations
                    .map((v) => v.squareVariationId)
                    .sort(),
            ).toEqual([`${P}-pie-box`, `${P}-pie-large`]);

            const archived =
                await catalogService.findCatalogForCurrentTenant('archived');
            expect(
                archived.items.map((i) => [
                    i.squareItemId,
                    i.variations.map((v) => v.squareVariationId),
                ]),
            ).toEqual([
                [`${P}-pie`, [`${P}-pie-gone`]],
                [`${P}-dead`, [`${P}-dead-large`]],
                [`${P}-old`, [`${P}-old-large`]],
            ]);

            const all = await catalogService.findCatalogForCurrentTenant('all');
            expect(all.items).toHaveLength(3);
        });
    });

    it('keeps versions beyond 2^53 exact and serializes the catalog with bigint money in the fixture', async () => {
        const version = 1761600000000123457n;
        stubCatalog([
            pie([variation('pie-big', 'pie', `${P} Small`, { version })]),
        ]);
        await syncService.fullSync(connection);

        expect((await findVariation('pie-big')).squareVersion).toBe(
            version.toString(),
        );
        const catalog = await catalogService.findCatalogForCurrentTenant();
        const json = JSON.stringify(catalog);
        expect(json).toContain(`"squareVersion":"${version.toString()}"`);
    });

    describe('modifiers', () => {
        const slots = ['slot-1', 'slot-2', 'slot-3'];
        const flavors = (slot: string) => [
            modifier(`${slot}-cc`, slot, `${P} Chocolate Chip`),
            modifier(`${slot}-sugar`, slot, `${P} Sugar`),
        ];
        /** A cookie box with one modifier list per slot, each with every flavor. */
        const cookieBoxFixture = (boxSlots = slots) => [
            item('cbox', `${P} Box of 6 Cookies`, {
                variations: [variation('cbox-6', 'cbox', `${P} Box`)],
                modifierListIds: boxSlots,
            }),
            ...boxSlots.map((slot, i) =>
                modifierList(slot, `Cookie ${i + 1}`, flavors(slot)),
            ),
        ];
        const muffinBoxFixture = () => [
            item('mbox', `${P} Box of 6 Muffins`, {
                categoryId: 'cat-pies',
                variations: [variation('mbox-6', 'mbox', `${P} Box`)],
                modifierListIds: ['m-slot'],
            }),
            modifierList('m-slot', 'Muffin 1', [
                modifier('m-slot-sugar', 'm-slot', `${P} sugar`),
            ]),
        ];
        const findModifier = (id: string) =>
            modifierRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareModifierId: `${P}-${id}`,
            });

        it('creates one modifier link per slot per flavor, needing review', async () => {
            const requests = stubCatalog(cookieBoxFixture());
            await syncService.fullSync(connection);

            expect(requests[0].objectTypes).toEqual(
                expect.arrayContaining(['MODIFIER_LIST', 'MODIFIER']),
            );
            const links = await modifierRepo.find({
                where: { tenantId: tenant.id },
                order: { squareModifierId: 'ASC' },
            });
            expect(links).toHaveLength(6);
            for (const link of links) {
                expect(link).toMatchObject({
                    squareItemIds: [`${P}-cbox`],
                    isDeleted: false,
                    enabled: true,
                    mappingSource: 'derived',
                    reviewedAt: null,
                });
            }
            expect(await findModifier('slot-2-sugar')).toMatchObject({
                squareModifierListId: `${P}-slot-2`,
                squareModifierListName: 'Cookie 2',
                squareModifierName: `${P} Sugar`,
                kind: 'item',
                menuItemId: null,
                menuItemSizeId: null,
            });
            // Exactly one SINGLE menu item with that name and one size
            expect(await findModifier('slot-3-cc')).toMatchObject({
                menuItemId: chocolateChip.id,
                menuItemSizeId: small.id,
            });
        });

        it("gives new and unmapped modifiers their mapped siblings' mapping, never across items", async () => {
            stubCatalog(cookieBoxFixture(['slot-1', 'slot-2']));
            await syncService.fullSync(connection);
            await modifierRepo.update(
                { id: (await findModifier('slot-1-sugar')).id },
                { kind: 'ignore', mappingSource: 'manual' },
            );

            stubCatalog([pies(), ...cookieBoxFixture(), ...muffinBoxFixture()]);
            await syncService.fullSync(connection);

            // Existing unmapped sibling and the new slot follow
            expect(await findModifier('slot-2-sugar')).toMatchObject({
                kind: 'ignore',
                mappingSource: 'derived',
            });
            expect(await findModifier('slot-3-sugar')).toMatchObject({
                kind: 'ignore',
                mappingSource: 'derived',
                reviewedAt: null,
            });
            // Same name, other Square item
            expect(await findModifier('m-slot-sugar')).toMatchObject({
                kind: 'item',
                menuItemId: null,
                squareItemIds: [`${P}-mbox`],
            });
        });

        it('keeps tenant choices across re-syncs while refreshing Square-side fields', async () => {
            stubCatalog(cookieBoxFixture());
            await syncService.fullSync(connection);
            const ignored = await findModifier('slot-1-sugar');
            await modifierRepo.update(ignored.id, {
                kind: 'ignore',
                mappingSource: 'manual',
                enabled: false,
            });

            stubCatalog([
                ...cookieBoxFixture(),
                modifierList('slot-1', 'First cookie', [
                    modifier('slot-1-sugar', 'slot-1', `${P} Sugar Cookie`),
                ]),
            ]);
            await syncService.fullSync(connection);

            expect(await findModifier('slot-1-sugar')).toMatchObject({
                squareModifierListName: 'First cookie',
                squareModifierName: `${P} Sugar Cookie`,
                kind: 'ignore',
                mappingSource: 'manual',
                enabled: false,
            });
        });

        it('follows attachments, deleted lists and top-level modifiers in an incremental sync', async () => {
            stubCatalog(cookieBoxFixture());
            await syncService.fullSync(connection);

            stubCatalog([
                // The box drops slot 3
                item('cbox', `${P} Box of 6 Cookies`, {
                    variations: [],
                    modifierListIds: ['slot-1', 'slot-2'],
                }),
                modifierList('slot-2', 'Cookie 2', [], { isDeleted: true }),
                modifier('slot-1-oat', 'slot-1', `${P} Oatmeal`),
            ]);
            await syncService.syncSince(connection, '2026-10-28T12:00:00.000Z');

            expect((await findModifier('slot-3-cc')).squareItemIds).toEqual([]);
            expect((await findModifier('slot-2-cc')).isDeleted).toBe(true);
            expect((await findModifier('slot-1-cc')).isDeleted).toBe(false);
            expect(await findModifier('slot-1-oat')).toMatchObject({
                squareModifierListName: 'Cookie 1',
                squareItemIds: [`${P}-cbox`],
                reviewedAt: null,
            });
        });

        it('starts new modifiers disabled when all their items are in a disabled category', async () => {
            stubCatalog([pies(), ...muffinBoxFixture()]);
            await syncService.fullSync(connection);
            await categoryRepo.update(
                { tenantId: tenant.id, squareCategoryId: `${P}-cat-pies` },
                { enabled: false },
            );

            stubCatalog([
                pies(),
                ...muffinBoxFixture(),
                modifier('m-slot-blue', 'm-slot', 'Blueberry'),
            ]);
            await syncService.fullSync(connection);

            expect((await findModifier('m-slot-blue')).enabled).toBe(false);
            expect((await findModifier('m-slot-sugar')).enabled).toBe(true);
        });
    });
});
