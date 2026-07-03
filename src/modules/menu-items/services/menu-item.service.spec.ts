import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import {
    DynamicPropertyConfig,
    HolderEntityType,
    ValueType,
} from '../../dynamic-properties/entities/dynamic-property-config.entity';
import { RevisionHistory } from '../../revision-history/entities/revision-history.entity';
import { REVISION_ENTITY_TYPES } from '../../revision-history/constants/revision-entity-type';
import { MenuItemSnapshotV2, MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION } from '../utils/snapshots/menu-item-snapshot.v2';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemDynamicPropertyValue } from '../entities/menu-item-dynamic-property-value.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemService } from './menu-item.service';

class TestableMenuItemService extends MenuItemService {
    async createEntityForTest(
        dto: CreateMenuItemDto,
        manager: EntityManager,
    ): Promise<MenuItem> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateMenuItemDto,
        entity: MenuItem,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('menu item service', () => {
    let testingUtil: MenuItemTestingUtil;
    let service: TestableMenuItemService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let valueRepo: Repository<MenuItemDynamicPropertyValue>;
    let configRepo: Repository<DynamicPropertyConfig>;

    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let containerLines: MenuItemContainerItem[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemServiceClass: TestableMenuItemService,
        });
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        service = module.get<MenuItemService>(MenuItemService) as TestableMenuItemService;
        dataSource = module.get(DataSource);
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        valueRepo = module.get(getRepositoryToken(MenuItemDynamicPropertyValue));
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));

        ({ categories, sizes, singleItems, fixedContainerItems, varContainerItems, containerLines } =
            await testingUtil.seedContainerLines(P));
    });

    afterAll(async () => {
        await containerItemRepo.delete(containerLines.map((l) => l.id));
        await itemRepo.delete([
            ...fixedContainerItems.map((i) => i.id),
            ...varContainerItems.map((i) => i.id),
            ...singleItems.map((i) => i.id),
        ]);
        await categoryRepo.delete(categories.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('single item lifecycle', () => {
        let created: MenuItem;

        it('should create item of type single', async () => {
            const dto = plainToInstance(CreateMenuItemDto, {
                name: `${P}-single-item`,
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: categories[0].id,
                sizeIds: [sizes[0].id, sizes[1].id],
            });
            await dataSource.transaction(async (manager) => {
                created = await service.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
            expect(created.type).toBe(MENU_ITEM_TYPES.SINGLE);
        });

        it('should remove single item', async () => {
            await service.remove(created.id);
            await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    describe('container item lifecycle', () => {
        let created: MenuItem;

        afterAll(async () => {
            if (created?.id) await itemRepo.delete(created.id);
        });

        it('should create item of type container', async () => {
            const containedItem = singleItems[0];
            const dto = plainToInstance(CreateMenuItemDto, {
                name: `${P}-container-item`,
                type: MENU_ITEM_TYPES.CONTAINER,
                categoryId: categories[0].id,
                sizeIds: [sizes[2].id, sizes[3].id],
                containerMenuItems: [
                    plainToInstance(NestedCreateMenuItemContainerItemDto, {
                        createId: 'c1',
                        containedMenuItemId: containedItem.id,
                        containedItemSizeId: sizes[0].id,
                        quantity: 4,
                        parentItemSizeId: sizes[2].id,
                    }),
                ],
            });
            await dataSource.transaction(async (manager) => {
                created = await service.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
            expect(created.type).toBe(MENU_ITEM_TYPES.CONTAINER);
            expect(created.variableMaxAmount == null).toBe(true);
            expect(created.containerMenuItems).not.toBeNull();
            expect(created.containerMenuItems?.length).toBe(1);
            expect(created.containerMenuItems?.[0].containedMenuItem.id).toBe(containedItem.id);
        });

        it('should update container item (add nested container line)', async () => {
            const parent = await itemRepo.findOneOrFail({
                where: { id: created.id },
                relations: ['containerMenuItems', 'sizes', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize', 'category'],
            });
            if (!parent.containerMenuItems?.length || !parent.sizes?.length)
                throw new Error('container item or its containerMenuItems not found');

            const existingLine = parent.containerMenuItems[0];
            const newContained = singleItems[1];
            const dto = plainToInstance(UpdateMenuItemDto, {
                name: parent.name,
                type: parent.type,
                categoryId: parent.category?.id ?? null,
                variableMaxAmount: parent.variableMaxAmount ?? null,
                sizeIds: parent.sizes.map((s) => s.id),
                containerMenuItems: [
                    plainToInstance(NestedUpdateMenuItemContainerItemDto, {
                        id: existingLine.id,
                        containedMenuItemId: existingLine.containedMenuItem.id,
                        containedItemSizeId: existingLine.containedItemSize.id,
                        quantity: existingLine.quantity,
                    }),
                    plainToInstance(NestedCreateMenuItemContainerItemDto, {
                        createId: 'new-line',
                        containedMenuItemId: newContained.id,
                        containedItemSizeId: sizes[0].id,
                        quantity: 3,
                        parentItemSizeId: parent.sizes[0].id,
                    }),
                ],
            });

            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, parent, manager);
            });

            const updated = await itemRepo.findOneOrFail({
                where: { id: created.id },
                relations: ['containerMenuItems'],
            });
            expect(updated.containerMenuItems!.length).toBe(2);
        });
    });

    it('should find seeded item in findAll results', async () => {
        const result = await service.findAll({ limit: 100 });
        const found = result.items.find((i) => i.id === singleItems[0].id);
        expect(found).toBeDefined();
    });

    it('should find all items with search by name', async () => {
        const result = await service.findAll({ search: P, limit: 100 });
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.every((i) => i.name.includes(P))).toBe(true);
    });

    it('should find all items with filter by category', async () => {
        const cat = categories[0];
        const result = await service.findAll({
            filters: [`category=${cat.id}`],
            limit: 100,
        });
        expect(result.items.length).toBeGreaterThan(0);
        // singleItems[0] is seeded with categories[0]
        const resultIds = result.items.map((i) => i.id);
        expect(resultIds).toContain(singleItems[0].id);
    });

    it('should find all items with filter by type', async () => {
        const result = await service.findAll({
            filters: [`type=${MENU_ITEM_TYPES.SINGLE}`],
            limit: 100,
        });
        const seededSingle = result.items.find((i) => i.id === singleItems[0].id);
        expect(seededSingle).toBeDefined();
        expect(result.items.every((i) => i.type === MENU_ITEM_TYPES.SINGLE)).toBe(true);
    });

    it('should find one item with relations', async () => {
        const container = fixedContainerItems[0];
        const result = await service.findOne(container.id, [
            'category',
            'sizes',
            'containerMenuItems',
            'containerMenuItems.containedMenuItem',
            'containerMenuItems.containedItemSize',
        ]);
        expect(result.id).toBe(container.id);
        expect(result.category).toBeDefined();
        expect(result.sizes).toBeDefined();
        expect(Array.isArray(result.containerMenuItems)).toBe(true);
        expect(result.containerMenuItems?.[0].containedMenuItem).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('dynamic property value write path', () => {
        let testFilepathConfig: DynamicPropertyConfig;
        let testEntityRefConfig: DynamicPropertyConfig;
        let dpTestItemId: number;
        let dpOmitTestItemId: number;

        beforeAll(async () => {
            testFilepathConfig = await configRepo.save(
                configRepo.create({
                    holderEntityType: HolderEntityType.MenuItem,
                    propertyName: `${P}-service-spec-filepath`,
                    valueType: ValueType.Filepath,
                }),
            );
            testEntityRefConfig = await configRepo.save(
                configRepo.create({
                    holderEntityType: HolderEntityType.MenuItem,
                    propertyName: `${P}-service-spec-entity-ref`,
                    valueType: ValueType.EntityReference,
                    valueEntityType: 'menuItem',
                }),
            );
        });

        afterAll(async () => {
            if (dpTestItemId) await itemRepo.delete(dpTestItemId);
            if (dpOmitTestItemId) await itemRepo.delete(dpOmitTestItemId);
            await configRepo.delete([testFilepathConfig.id, testEntityRefConfig.id]);
        });

        it('should persist value rows when creating MenuItem with dynamicProperties', async () => {
            const dto = plainToInstance(CreateMenuItemDto, {
                name: `${P}-dp-create-test`,
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: categories[0].id,
                sizeIds: [sizes[0].id],
                dynamicProperties: [{ configId: testFilepathConfig.id, value: '/images/test.jpg' }],
            });

            await dataSource.transaction(async (manager) => {
                const result = await service.createEntityForTest(dto, manager);
                dpTestItemId = result.id;
            });

            const row = await valueRepo.findOne({
                where: { menuItem: { id: dpTestItemId }, config: { id: testFilepathConfig.id } },
            });
            expect(row).not.toBeNull();
            expect(row!.valueText).toBe('/images/test.jpg');
        });

        it('should upsert value row when updating with a new value', async () => {
            const full = await itemRepo.findOneOrFail({
                where: { id: dpTestItemId },
                relations: ['category', 'sizes', 'containerMenuItems'],
            });

            const dto = plainToInstance(UpdateMenuItemDto, {
                name: full.name,
                categoryId: full.category?.id ?? null,
                dynamicProperties: [{ configId: testFilepathConfig.id, value: '/images/updated.jpg' }],
            });

            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, full, manager);
            });

            const row = await valueRepo.findOne({
                where: { menuItem: { id: dpTestItemId }, config: { id: testFilepathConfig.id } },
            });
            expect(row).not.toBeNull();
            expect(row!.valueText).toBe('/images/updated.jpg');
        });

        it('should delete value row when updating with value: null', async () => {
            const full = await itemRepo.findOneOrFail({
                where: { id: dpTestItemId },
                relations: ['category', 'sizes', 'containerMenuItems'],
            });

            const dto = plainToInstance(UpdateMenuItemDto, {
                name: full.name,
                categoryId: full.category?.id ?? null,
                dynamicProperties: [{ configId: testFilepathConfig.id, value: null }],
            });

            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, full, manager);
            });

            const row = await valueRepo.findOne({
                where: { menuItem: { id: dpTestItemId }, config: { id: testFilepathConfig.id } },
            });
            expect(row).toBeNull();
        });

        it('should leave existing value row unchanged when config is omitted from update', async () => {
            const dto = plainToInstance(CreateMenuItemDto, {
                name: `${P}-dp-omit-test`,
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: categories[0].id,
                sizeIds: [sizes[0].id],
                dynamicProperties: [{ configId: testFilepathConfig.id, value: '/keep/this.jpg' }],
            });

            await dataSource.transaction(async (manager) => {
                const result = await service.createEntityForTest(dto, manager);
                dpOmitTestItemId = result.id;
            });

            const full = await itemRepo.findOneOrFail({
                where: { id: dpOmitTestItemId },
                relations: ['category', 'sizes', 'containerMenuItems'],
            });

            const updateDto = plainToInstance(UpdateMenuItemDto, {
                name: full.name,
                categoryId: full.category?.id ?? null,
            });

            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(updateDto, full, manager);
            });

            const row = await valueRepo.findOne({
                where: { menuItem: { id: dpOmitTestItemId }, config: { id: testFilepathConfig.id } },
            });
            expect(row).not.toBeNull();
            expect(row!.valueText).toBe('/keep/this.jpg');
        });

        it('should SET NULL on valueEntity when the referenced MenuItem is deleted', async () => {
            let refItemId!: number;
            await dataSource.transaction(async (manager) => {
                const ref = await service.createEntityForTest(
                    plainToInstance(CreateMenuItemDto, {
                        name: `${P}-ref-item-set-null`,
                        type: MENU_ITEM_TYPES.SINGLE,
                        categoryId: categories[0].id,
                        sizeIds: [sizes[0].id],
                    }),
                    manager,
                );
                refItemId = ref.id;
            });

            let holderItemId!: number;
            await dataSource.transaction(async (manager) => {
                const holder = await service.createEntityForTest(
                    plainToInstance(CreateMenuItemDto, {
                        name: `${P}-holder-item-set-null`,
                        type: MENU_ITEM_TYPES.SINGLE,
                        categoryId: categories[0].id,
                        sizeIds: [sizes[0].id],
                        dynamicProperties: [
                            { configId: testEntityRefConfig.id, value: String(refItemId) },
                        ],
                    }),
                    manager,
                );
                holderItemId = holder.id;
            });
            testCtx.addCleanupFunction(async () => { await itemRepo.delete(holderItemId); });

            let row = await valueRepo.findOne({
                where: { menuItem: { id: holderItemId }, config: { id: testEntityRefConfig.id } },
                relations: ['valueEntity'],
            });
            expect(row).not.toBeNull();
            expect(row!.valueEntity?.id).toBe(refItemId);

            await service.remove(refItemId);

            row = await valueRepo.findOne({
                where: { menuItem: { id: holderItemId }, config: { id: testEntityRefConfig.id } },
                relations: ['valueEntity'],
            });
            expect(row).not.toBeNull();
            expect(row!.valueEntity).toBeNull();
        });
    });
});

describe('menu item service – revision history snapshots', () => {
    let itemService: MenuItemService;
    let testCtx: DatabaseTestContext;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let configRepo: Repository<DynamicPropertyConfig>;
    let revisionRepo: Repository<RevisionHistory>;
    let itemRepo: Repository<MenuItem>;

    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];

    const PR = `${P}r`;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            mockRevisionHistory: false,
        });
        const testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        itemService = module.get(MenuItemService);
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
        revisionRepo = module.get(getRepositoryToken(RevisionHistory));
        itemRepo = module.get(getRepositoryToken(MenuItem));

        ({ categories, sizes } = await testingUtil.seedItems(PR));
    });

    afterAll(async () => {
        await categoryRepo.delete(categories.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('v2 snapshot with dynamicProperties', () => {
        let testConfig: DynamicPropertyConfig;
        let createdItem: MenuItem;

        beforeAll(async () => {
            testConfig = await configRepo.save(
                configRepo.create({
                    holderEntityType: HolderEntityType.MenuItem,
                    propertyName: `${PR}-rev-spec-filepath`,
                    valueType: ValueType.Filepath,
                }),
            );
        });

        afterAll(async () => {
            if (createdItem) await itemRepo.delete(createdItem.id);
            await configRepo.delete(testConfig.id);
        });

        it('should store a v2 snapshot with dynamicProperties on create', async () => {
            const dto = plainToInstance(CreateMenuItemDto, {
                name: `${PR}-rev-create-test`,
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: categories[0].id,
                sizeIds: [sizes[0].id],
                dynamicProperties: [{ configId: testConfig.id, value: '/images/snap.jpg' }],
            });

            createdItem = await itemService.create(dto);

            const revision = await revisionRepo.findOne({
                where: {
                    entityType: REVISION_ENTITY_TYPES.MENU_ITEM,
                    entityId: createdItem.id,
                    revisionNumber: 1,
                },
            });

            expect(revision).not.toBeNull();
            const snap = revision!.payload as unknown as MenuItemSnapshotV2;
            expect(snap.payloadVersion).toBe(MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION);
            expect(Array.isArray(snap.dynamicProperties)).toBe(true);
            expect(snap.dynamicProperties).toHaveLength(1);
            expect(snap.dynamicProperties[0].configId).toBe(testConfig.id);
            expect(snap.dynamicProperties[0].valueText).toBe('/images/snap.jpg');
            expect(snap.dynamicProperties[0].valueEntityId).toBeNull();
        });

        it('should store a v2 snapshot with updated dynamicProperties on update', async () => {
            const item = await itemRepo.findOneOrFail({
                where: { id: createdItem.id },
                relations: ['category', 'sizes'],
            });

            const dto = plainToInstance(UpdateMenuItemDto, {
                name: item.name,
                dynamicProperties: [{ configId: testConfig.id, value: '/images/updated-snap.jpg' }],
            });

            await itemService.update(item.id, dto);

            const revision = await revisionRepo.findOne({
                where: {
                    entityType: REVISION_ENTITY_TYPES.MENU_ITEM,
                    entityId: item.id,
                    revisionNumber: 2,
                },
            });

            expect(revision).not.toBeNull();
            const snap = revision!.payload as unknown as MenuItemSnapshotV2;
            expect(snap.payloadVersion).toBe(MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION);
            expect(snap.dynamicProperties[0].valueText).toBe('/images/updated-snap.jpg');
        });
    });

    it('should store dynamicProperties: [] for an item with no dynamic property values', async () => {
        const dto = plainToInstance(CreateMenuItemDto, {
            name: `${PR}-rev-no-props-test`,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: categories[0].id,
            sizeIds: [sizes[0].id],
        });

        const created = await itemService.create(dto);
        testCtx.addCleanupFunction(async () => { await itemRepo.delete(created.id); });

        const revision = await revisionRepo.findOne({
            where: {
                entityType: REVISION_ENTITY_TYPES.MENU_ITEM,
                entityId: created.id,
                revisionNumber: 1,
            },
        });

        expect(revision).not.toBeNull();
        const snap = revision!.payload as unknown as MenuItemSnapshotV2;
        expect(snap.payloadVersion).toBe(MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION);
        expect(snap.dynamicProperties).toEqual([]);
    });
});
