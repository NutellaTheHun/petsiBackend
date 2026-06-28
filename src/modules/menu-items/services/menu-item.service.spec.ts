import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
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
import { item_a } from '../utils/constants';
import { menuItemToUpdateDto } from '../utils/entity-transformers/menu-item.dto.transfomer';
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

describe('menu item service', () => {
    let testingUtil: MenuItemTestingUtil;
    let itemService: TestableMenuItemService;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let valueRepo: Repository<MenuItemDynamicPropertyValue>;
    let configRepo: Repository<DynamicPropertyConfig>;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemServiceClass: TestableMenuItemService,
        });
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);
        dataSource = module.get(DataSource);
        itemService = module.get(MenuItemService) as TestableMenuItemService;
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        valueRepo = module.get(getRepositoryToken(MenuItemDynamicPropertyValue));
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(itemService).toBeDefined();
    });

    // test createEntity() of type single
    it('should create item of type single', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
        if (!cat || sizeIds.length < 2) throw new Error('fixtures not found');
        const dto = plainToInstance(CreateMenuItemDto, {
            name: 'Single Item',
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: cat.id,
            sizeIds,
        });

        await dataSource.transaction(async (manager) => {
            const result = await itemService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.name).toEqual(dto.name);
            expect(result.type).toEqual(MENU_ITEM_TYPES.SINGLE);
        });
    });

    // test createEntity() of type container (With NestedCreateMenuItemContainerItemDto, variableMaxAmount = null)
    it('should create item of type container (With NestedCreateMenuItemContainerItemDto, variableMaxAmount = null)', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
        if (!cat || sizeIds.length < 2) throw new Error('fixtures not found');
        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) throw new Error('contained item not found');
        const dto = plainToInstance(CreateMenuItemDto, {
            name: 'Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: cat.id,
            sizeIds,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 4,
                    parentItemSizeId: sizeIds[0],
                }),
            ],
        });

        await dataSource.transaction(async (manager) => {
            const result = await itemService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.name).toEqual(dto.name);
            expect(result.type).toEqual(MENU_ITEM_TYPES.CONTAINER);
            expect(result.variableMaxAmount == null).toBe(true);
            expect(result.containerMenuItems).not.toBeNull();
            expect(result.containerMenuItems?.length).toBe(1);
            expect(result.containerMenuItems?.[0].id).toBeDefined();
            expect(result.containerMenuItems?.[0].quantity).toBe(4);
            expect(result.containerMenuItems?.[0].containedMenuItem.id).toBe(
                containedItem.id,
            );
            expect(result.containerMenuItems?.[0].containedItemSize.id).toBe(
                containedItem.sizes[0].id,
            );
        });
    });

    // test updateEntity() of type container with NestedUpdate (and NestedCreate if context had parentItemSizeId)
    it('should update item of type container (With NestedUpdateMenuItemContainerItemDto and NestedCreateMenuItemContainerItemDto)', async () => {
        const parent = await itemRepo.findOne({
            where: { containerMenuItems: MoreThan(0) },
            relations: ['containerMenuItems', 'sizes', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize', 'category'],
        });
        if (!parent?.containerMenuItems?.length || !parent.sizes?.length)
            throw new Error('container item_f or its containerMenuItems not found');
        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) throw new Error('contained item not found');
        const dto = menuItemToUpdateDto(parent, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[1].id,
                    quantity: 5,
                    parentItemSizeId: parent.sizes[0].id,
                })]
        });

        const containedToUpdate = dto.containerMenuItems?.pop() as NestedUpdateMenuItemContainerItemDto;
        if (!containedToUpdate) throw new Error('contained to update not found');
        const updateDto = plainToInstance(NestedUpdateMenuItemContainerItemDto, {
            id: containedToUpdate.id,
            containedMenuItemId: containedToUpdate.containedMenuItemId,
            containedItemSizeId: containedToUpdate.containedItemSizeId,
            quantity: 99
        });
        dto.containerMenuItems?.push(updateDto);

        await dataSource.transaction(async (manager) => {
            await itemService.updateEntityForTest(dto, parent, manager);
        });

        const updated = await containerItemRepo.findOne({
            where: { id: containedToUpdate.id },
        });
        if (!updated) throw new Error('result not found');
        expect(updated.quantity).toEqual(99);

        const updatedItem = await itemRepo.findOne({
            where: { id: parent.id },
            relations: ['containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize'],
        });
        if (!updatedItem) throw new Error('updated item not found');
        expect(updatedItem.containerMenuItems).not.toBeNull();
        // expect to find created item in containerMenuItems by seraching for containedMenuItem id, containedItemSize id, and quantity = 5
        expect(
            updatedItem.containerMenuItems?.find(
                (c) =>
                    c.containedMenuItem.id === containedItem.id &&
                    c.containedItemSize.id === containedItem.sizes[0].id &&
                    c.quantity === 5,
            ),
        ).not.toBeNull();
    });

    // test findAll()
    it('should find all items', async () => {
        const repoResult = await itemRepo.find();
        const serviceResult = await itemService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with search by name
    it('should find all items with search by name', async () => {
        const serviceResult = await itemService.findAll({
            search: 'item',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(
            serviceResult?.items.every((i) => i.name.toLowerCase().includes('item')),
        ).toBe(true);
    });

    // test findAll() with filter by category
    it('should find all items with filter by category', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        if (!cat) throw new Error('category not found');
        const repoResult = await itemRepo.find({
            where: { category: { id: cat.id } },
        });
        const serviceResult = await itemService.findAll({
            filters: [`category=${cat.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with sort by name
    it('should find all items with sort by name', async () => {
        const repoResult = await itemRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await itemService.findAll({
            sortBy: 'name',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0)
            expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
    });

    // test findAll() with sort by category
    it('should find all items with sort by category', async () => {
        const repoResult = await itemRepo.find({
            order: { category: { name: 'DESC' } },
        });
        if (!repoResult.length) throw new Error('items not found');

        const serviceResult = await itemService.findAll({
            sortBy: 'category',
            sortOrder: 'DESC',
            limit: 100,
        });
        if (!serviceResult) throw new Error('service result not found');

        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
        expect(serviceResult.items.length).toEqual(repoResult.length);
        // expect first item of serviceResult and category result to be the same
        expect(serviceResult?.items[0]?.category?.id).toEqual(
            repoResult[0]?.category?.id,
        );
        // expect last item of serviceResult and category result to be the same
        expect(
            serviceResult?.items[serviceResult.items.length - 1]?.category?.id,
        ).toEqual(repoResult[repoResult.length - 1]?.category?.id);
    });

    // test findOne()
    it('should find one item', async () => {
        const [item] = await itemRepo.find({ take: 1 });
        if (!item) throw new Error('item not found');

        const serviceResult = await itemService.findOne(item.id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(item.id);
    });

    // test findOne() with relations
    it('should find one item with relations', async () => {
        const item = await itemRepo.findOneOrFail({ where: { containerMenuItems: MoreThan(0) }, relations: ['category', 'sizes', 'containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize'] });
        if (!item.containerMenuItems) { throw new Error('conatiner items not found') }

        const serviceResult = await itemService.findOne(item.id, [
            'category',
            'sizes',
            'containerMenuItems',
            'containerMenuItems.containedMenuItem',
            'containerMenuItems.containedItemSize',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(item.id);
        expect(serviceResult?.category).toBeDefined();
        expect(serviceResult?.sizes).toBeDefined();
        expect(Array.isArray(serviceResult?.containerMenuItems)).toBe(true);
        expect(serviceResult?.containerMenuItems?.[0].containedMenuItem).toBeDefined();
        expect(serviceResult?.containerMenuItems?.[0].containedItemSize).toBeDefined();
    });

    // test remove()
    it('should remove item', async () => {
        const item = await itemRepo.findOne({ where: { name: 'Single Item' } });
        if (!item) throw new Error('item not found (create "Single Item" first)');
        const id = item.id;

        const deleteResult = await itemService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(itemService.findOne(id)).rejects.toThrow(NotFoundException);
    });

    // test findAll() with filter by type
    it('should find all items with filter by type', async () => {
        const serviceResult = await itemService.findAll({
            filters: [`type=${MENU_ITEM_TYPES.SINGLE}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
        expect(serviceResult?.items.every((i) => i.type === MENU_ITEM_TYPES.SINGLE)).toBe(true);
    });

    describe('dynamic property value write path', () => {
        let testFilepathConfig: DynamicPropertyConfig;
        let testEntityRefConfig: DynamicPropertyConfig;

        beforeAll(async () => {
            testFilepathConfig = await configRepo.save(
                configRepo.create({
                    holderEntityType: HolderEntityType.MenuItem,
                    propertyName: 'service-spec-filepath',
                    valueType: ValueType.Filepath,
                }),
            );
            testEntityRefConfig = await configRepo.save(
                configRepo.create({
                    holderEntityType: HolderEntityType.MenuItem,
                    propertyName: 'service-spec-entity-ref',
                    valueType: ValueType.EntityReference,
                    valueEntityType: 'menuItem',
                }),
            );

            dbTestContext.addCleanupFunction(async () => {
                await configRepo.delete([testFilepathConfig.id, testEntityRefConfig.id]);
            });
        });

        it('should persist value rows when creating MenuItem with dynamicProperties', async () => {
            const [cat] = await categoryRepo.find({ take: 1 });
            const sizeIds = (await sizeRepo.find({ take: 1 })).map((s) => s.id);

            const dto = plainToInstance(CreateMenuItemDto, {
                name: 'Dynamic Prop Create Test',
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: cat?.id ?? null,
                sizeIds,
                dynamicProperties: [{ configId: testFilepathConfig.id, value: '/images/test.jpg' }],
            });

            await dataSource.transaction(async (manager) => {
                await itemService.createEntityForTest(dto, manager);
            });

            const item = await itemRepo.findOneOrFail({ where: { name: 'Dynamic Prop Create Test' } });
            const row = await valueRepo.findOne({
                where: {
                    menuItem: { id: item.id },
                    config: { id: testFilepathConfig.id },
                },
            });
            expect(row).not.toBeNull();
            expect(row!.valueText).toBe('/images/test.jpg');
        });

        it('should upsert value row when updating with a new value', async () => {
            const item = await itemRepo.findOneOrFail({ where: { name: 'Dynamic Prop Create Test' } });
            const full = await itemRepo.findOneOrFail({
                where: { id: item.id },
                relations: ['category', 'sizes', 'containerMenuItems'],
            });

            // Omit `type` to avoid triggering syncOrderMenuItems for SINGLE-type items
            const dto = plainToInstance(UpdateMenuItemDto, {
                name: full.name,
                categoryId: full.category?.id ?? null,
                dynamicProperties: [{ configId: testFilepathConfig.id, value: '/images/updated.jpg' }],
            });

            await dataSource.transaction(async (manager) => {
                await itemService.updateEntityForTest(dto, full, manager);
            });

            const row = await valueRepo.findOne({
                where: {
                    menuItem: { id: item.id },
                    config: { id: testFilepathConfig.id },
                },
            });
            expect(row).not.toBeNull();
            expect(row!.valueText).toBe('/images/updated.jpg');
        });

        it('should delete value row when updating with value: null', async () => {
            const item = await itemRepo.findOneOrFail({ where: { name: 'Dynamic Prop Create Test' } });
            const full = await itemRepo.findOneOrFail({
                where: { id: item.id },
                relations: ['category', 'sizes', 'containerMenuItems'],
            });

            // Omit `type` to avoid triggering syncOrderMenuItems for SINGLE-type items
            const dto = plainToInstance(UpdateMenuItemDto, {
                name: full.name,
                categoryId: full.category?.id ?? null,
                dynamicProperties: [{ configId: testFilepathConfig.id, value: null }],
            });

            await dataSource.transaction(async (manager) => {
                await itemService.updateEntityForTest(dto, full, manager);
            });

            const row = await valueRepo.findOne({
                where: {
                    menuItem: { id: item.id },
                    config: { id: testFilepathConfig.id },
                },
            });
            expect(row).toBeNull();
        });

        it('should leave existing value row unchanged when config is omitted from update', async () => {
            const [cat] = await categoryRepo.find({ take: 1 });
            const sizeIds = (await sizeRepo.find({ take: 1 })).map((s) => s.id);

            const createDto = plainToInstance(CreateMenuItemDto, {
                name: 'Dynamic Prop Omit Test',
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: cat?.id ?? null,
                sizeIds,
                dynamicProperties: [{ configId: testFilepathConfig.id, value: '/keep/this.jpg' }],
            });

            let createdId!: number;
            await dataSource.transaction(async (manager) => {
                const result = await itemService.createEntityForTest(createDto, manager);
                createdId = result.id;
            });

            const full = await itemRepo.findOneOrFail({
                where: { id: createdId },
                relations: ['category', 'sizes', 'containerMenuItems'],
            });

            // Omit `type` to avoid triggering syncOrderMenuItems; omit dynamicProperties to verify no-op
            const updateDto = plainToInstance(UpdateMenuItemDto, {
                name: full.name,
                categoryId: full.category?.id ?? null,
            });

            await dataSource.transaction(async (manager) => {
                await itemService.updateEntityForTest(updateDto, full, manager);
            });

            const row = await valueRepo.findOne({
                where: {
                    menuItem: { id: createdId },
                    config: { id: testFilepathConfig.id },
                },
            });
            expect(row).not.toBeNull();
            expect(row!.valueText).toBe('/keep/this.jpg');
        });

        it('should SET NULL on valueEntity when the referenced MenuItem is deleted', async () => {
            const [cat] = await categoryRepo.find({ take: 1 });
            const sizeIds = (await sizeRepo.find({ take: 1 })).map((s) => s.id);

            let refItemId!: number;
            await dataSource.transaction(async (manager) => {
                const ref = await itemService.createEntityForTest(
                    plainToInstance(CreateMenuItemDto, {
                        name: 'Referenced Item For SET NULL',
                        type: MENU_ITEM_TYPES.SINGLE,
                        categoryId: cat?.id ?? null,
                        sizeIds,
                    }),
                    manager,
                );
                refItemId = ref.id;
            });

            let holderItemId!: number;
            await dataSource.transaction(async (manager) => {
                const holder = await itemService.createEntityForTest(
                    plainToInstance(CreateMenuItemDto, {
                        name: 'Holder Item For SET NULL',
                        type: MENU_ITEM_TYPES.SINGLE,
                        categoryId: cat?.id ?? null,
                        sizeIds,
                        dynamicProperties: [
                            { configId: testEntityRefConfig.id, value: String(refItemId) },
                        ],
                    }),
                    manager,
                );
                holderItemId = holder.id;
            });

            let row = await valueRepo.findOne({
                where: {
                    menuItem: { id: holderItemId },
                    config: { id: testEntityRefConfig.id },
                },
                relations: ['valueEntity'],
            });
            expect(row).not.toBeNull();
            expect(row!.valueEntity?.id).toBe(refItemId);

            await itemService.remove(refItemId);

            row = await valueRepo.findOne({
                where: {
                    menuItem: { id: holderItemId },
                    config: { id: testEntityRefConfig.id },
                },
                relations: ['valueEntity'],
            });
            expect(row).not.toBeNull();
            expect(row!.valueEntity).toBeNull();
        });
    });
});

describe('menu item service – revision history snapshots', () => {
    let itemService: MenuItemService;
    let dbTestContext: DatabaseTestContext;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let configRepo: Repository<DynamicPropertyConfig>;
    let revisionRepo: Repository<RevisionHistory>;
    let itemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            mockRevisionHistory: false,
        });
        dbTestContext = new DatabaseTestContext();
        itemService = module.get(MenuItemService);
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
        revisionRepo = module.get(getRepositoryToken(RevisionHistory));
        itemRepo = module.get(getRepositoryToken(MenuItem));

        const testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should store a v2 snapshot with dynamicProperties on create', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const sizeIds = (await sizeRepo.find({ take: 1 })).map((s) => s.id);

        const config = await configRepo.save(
            configRepo.create({
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: 'rev-spec-filepath',
                valueType: ValueType.Filepath,
            }),
        );
        dbTestContext.addCleanupFunction(async () => {
            await configRepo.delete(config.id);
        });

        const dto = plainToInstance(CreateMenuItemDto, {
            name: 'Rev History Create Test',
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: cat?.id ?? null,
            sizeIds,
            dynamicProperties: [{ configId: config.id, value: '/images/snap.jpg' }],
        });

        const created = await itemService.create(dto);
        dbTestContext.addCleanupFunction(async () => {
            await itemRepo.delete(created.id);
        });

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
        expect(Array.isArray(snap.dynamicProperties)).toBe(true);
        expect(snap.dynamicProperties).toHaveLength(1);
        expect(snap.dynamicProperties[0].configId).toBe(config.id);
        expect(snap.dynamicProperties[0].valueText).toBe('/images/snap.jpg');
        expect(snap.dynamicProperties[0].valueEntityId).toBeNull();
    });

    it('should store a v2 snapshot with updated dynamicProperties on update', async () => {
        const item = await itemRepo.findOneOrFail({
            where: { name: 'Rev History Create Test' },
            relations: ['category', 'sizes'],
        });

        const config = await configRepo.findOneOrFail({
            where: { propertyName: 'rev-spec-filepath' },
        });

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: item.name,
            dynamicProperties: [{ configId: config.id, value: '/images/updated-snap.jpg' }],
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
        expect(Array.isArray(snap.dynamicProperties)).toBe(true);
        expect(snap.dynamicProperties).toHaveLength(1);
        expect(snap.dynamicProperties[0].configId).toBe(config.id);
        expect(snap.dynamicProperties[0].valueText).toBe('/images/updated-snap.jpg');
    });

    it('should store dynamicProperties: [] for an item with no dynamic property values', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const sizeIds = (await sizeRepo.find({ take: 1 })).map((s) => s.id);

        const dto = plainToInstance(CreateMenuItemDto, {
            name: 'Rev History No Props Test',
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: cat?.id ?? null,
            sizeIds,
        });

        const created = await itemService.create(dto);
        dbTestContext.addCleanupFunction(async () => {
            await itemRepo.delete(created.id);
        });

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
