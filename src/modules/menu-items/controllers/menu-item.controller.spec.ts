import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { MoreThan, Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import {
    DynamicPropertyConfig,
    HolderEntityType,
    ValueType,
} from '../../dynamic-properties/entities/dynamic-property-config.entity';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemDynamicPropertyValue } from '../entities/menu-item-dynamic-property-value.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemService } from '../services/menu-item.service';
import { item_a, item_b, item_c } from '../utils/constants';
import { menuItemToUpdateDto } from '../utils/entity-transformers/menu-item.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemController } from './menu-item.controller';

describe('menu item controller', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: MenuItemController;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    beforeAll(async () => {
        module = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

        controller = module.get<MenuItemController>(MenuItemController);
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await itemRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search filters by name substring', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'item',
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((i) => i.name.toLowerCase().includes('item')),
        ).toBe(true);
    });

    it('findAll with filter by category matches repository', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        if (!cat) throw new Error('category not found');
        const repoResult = await itemRepo.find({
            where: { category: { id: cat.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`category=${cat.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with filter by type returns only singles', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`type=${MENU_ITEM_TYPES.SINGLE}`],
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((i) => i.type === MENU_ITEM_TYPES.SINGLE),
        ).toBe(true);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await itemRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'name',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findAll with sortBy category DESC aligns first and last with repository', async () => {
        const repoResult = await itemRepo.find({
            relations: ['category'],
            order: { category: { name: 'DESC' } },
        });
        if (!repoResult.length) throw new Error('items not found');

        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'category',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(result.items[0]?.category?.id).toEqual(repoResult[0]?.category?.id);
        expect(
            result.items[result.items.length - 1]?.category?.id,
        ).toEqual(repoResult[repoResult.length - 1]?.category?.id);
    });

    it('findOne returns a seeded item', async () => {
        const item = await itemRepo.findOne({ where: { name: item_a } });
        if (!item) throw new Error('seed item not found');
        const result = await controller.findOne(item.id);
        expect(result.id).toEqual(item.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new single menu item', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
        if (!cat || sizeIds.length < 2) throw new Error('fixtures not found');

        const dto = plainToInstance(CreateMenuItemDto, {
            name: 'ControllerMenuItemSingle',
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: cat.id,
            sizeIds,
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await itemRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const sizes = await sizeRepo.find();
        if (!sizes.length) throw new Error('sizes not found');

        const dto = plainToInstance(CreateMenuItemDto, {
            name: item_a,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides with another item', async () => {
        const items = await itemRepo.find({
            relations: [
                'category',
                'sizes',
                'containerMenuItems',
                'containerMenuItems.containedMenuItem',
                'containerMenuItems.containedItemSize',
            ],
        });
        const withContainer = items.filter(
            (i) =>
                i.containerMenuItems &&
                i.containerMenuItems.length > 0 &&
                i.category &&
                i.sizes &&
                i.sizes.length > 0,
        );
        if (withContainer.length < 2) {
            throw new Error('Not enough container menu items for collision test');
        }

        const itemToUpdate = withContainer[0];
        const existingItem = withContainer[1];
        const dto = menuItemToUpdateDto(itemToUpdate, {
            name: existingItem.name,
        });
        try {
            await controller.update(itemToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateMenuItemDto, {
            name: 'DoesNotMatter',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                MenuItemService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current item', async () => {
            const item = await itemRepo.findOne({
                where: { name: item_b },
                relations: [
                    'category',
                    'sizes',
                    'containerMenuItems',
                    'containerMenuItems.containedMenuItem',
                    'containerMenuItems.containedItemSize',
                ],
            });
            if (!item?.category || !item.sizes?.length) {
                throw new Error('item b not found');
            }
            const dto = menuItemToUpdateDto(item);
            const result = await controller.update(item.id, dto);
            expect(result.name).toEqual(item.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const item = await itemRepo.findOne({
                where: { name: item_c },
                relations: [
                    'category',
                    'sizes',
                    'containerMenuItems',
                    'containerMenuItems.containedMenuItem',
                    'containerMenuItems.containedItemSize',
                ],
            });
            if (!item?.category || !item.sizes?.length) {
                throw new Error('item c not found');
            }
            const newName = 'item c controller renamed';
            const dto = menuItemToUpdateDto(item, { name: newName });
            const result = await controller.update(item.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await itemRepo.findOne({ where: { id: item.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created item then findOne fails', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
        if (!cat || sizeIds.length < 2) throw new Error('fixtures not found');

        const created = await controller.create(
            plainToInstance(CreateMenuItemDto, {
                name: 'ControllerMenuItemRemove',
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: cat.id,
                sizeIds,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('dynamicProperties on read responses', () => {
        let dpTestContext: DatabaseTestContext;
        let configRepo: Repository<DynamicPropertyConfig>;
        let dpValueRepo: Repository<MenuItemDynamicPropertyValue>;
        let testItem: MenuItem;
        let valueItem: MenuItem;
        let config: DynamicPropertyConfig;

        beforeAll(async () => {
            dpTestContext = new DatabaseTestContext();
            configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
            dpValueRepo = module.get(getRepositoryToken(MenuItemDynamicPropertyValue));

            const [cat] = await categoryRepo.find({ take: 1 });
            const [size] = await sizeRepo.find({ take: 1 });
            if (!cat || !size) throw new Error('fixtures not found');

            // Create a config with entityReference value type
            config = configRepo.create({
                holderEntityType: HolderEntityType.MenuItem,
                holderCategory: null,
                propertyName: 'ControllerSpecVeganCounterpart',
                valueType: ValueType.EntityReference,
                valueEntityType: 'menuItem',
                valueEntityCategory: null,
            });
            config = await configRepo.save(config);
            dpTestContext.addCleanupFunction(async () => { await configRepo.delete(config.id); });

            // Create two items: one will hold the value, one will be the referenced value
            valueItem = itemRepo.create({
                name: 'ControllerSpecValueItem',
                type: MENU_ITEM_TYPES.SINGLE,
                category: cat,
                sizes: [size],
            });
            valueItem = await itemRepo.save(valueItem);
            dpTestContext.addCleanupFunction(async () => { await itemRepo.delete(valueItem.id); });

            testItem = itemRepo.create({
                name: 'ControllerSpecHolderItem',
                type: MENU_ITEM_TYPES.SINGLE,
                category: cat,
                sizes: [size],
            });
            testItem = await itemRepo.save(testItem);
            dpTestContext.addCleanupFunction(async () => { await itemRepo.delete(testItem.id); });

            // Save the dynamic property value row
            const dpValue = dpValueRepo.create({
                menuItem: testItem,
                config,
                valueEntity: valueItem,
                valueText: null,
            });
            await dpValueRepo.save(dpValue);
            dpTestContext.addCleanupFunction(async () => {
                await dpValueRepo.delete({ menuItem: { id: testItem.id }, config: { id: config.id } });
            });
        });

        afterAll(async () => {
            await dpTestContext.executeCleanupFunctions();
        });

        it('findOne includes dynamicProperties with full config metadata', async () => {
            const result = await controller.findOne(testItem.id);
            expect(result.dynamicProperties).toBeDefined();
            expect(result.dynamicProperties.length).toBe(1);
            const dp = result.dynamicProperties[0];
            expect(dp.configId).toBe(config.id);
            expect(dp.propertyName).toBe(config.propertyName);
            expect(dp.fieldRenderType).toBe('entity-select');
            expect(dp.valueType).toBe(ValueType.EntityReference);
            expect(dp.valueEntityType).toBe('menuItem');
            expect(dp.valueEntityCategoryId).toBeNull();
            expect(dp.value).toBe(valueItem.id.toString());
        });

        it('findAll includes dynamicProperties on each item', async () => {
            const result = await controller.findAll(undefined, 100);
            const found = result.items.find((i) => i.id === testItem.id);
            expect(found).toBeDefined();
            expect(found!.dynamicProperties.length).toBe(1);
            expect(found!.dynamicProperties[0].configId).toBe(config.id);
            expect(found!.dynamicProperties[0].value).toBe(valueItem.id.toString());
        });

        it('item with no dynamic property values returns empty dynamicProperties array', async () => {
            const plainItem = await itemRepo.findOne({ where: { name: item_a } });
            if (!plainItem) throw new Error('item a not found');
            const result = await controller.findOne(plainItem.id);
            expect(result.dynamicProperties).toEqual([]);
        });
    });
});
