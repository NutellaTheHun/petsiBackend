import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { DynamicPropertyConfig, HolderEntityType, ValueType } from '../../dynamic-properties/entities/dynamic-property-config.entity';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemDynamicPropertyValue } from '../entities/menu-item-dynamic-property-value.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { menuItemToUpdateDto } from '../utils/entity-transformers/menu-item.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemValidator } from './menu-item.validator';

const P = `t${Date.now()}`;

describe('menu item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let validator: MenuItemValidator;

    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let configRepo: Repository<DynamicPropertyConfig>;
    let dynPropValueRepo: Repository<MenuItemDynamicPropertyValue>;

    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let containerLines: MenuItemContainerItem[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        validator = module.get<MenuItemValidator>(MenuItemValidator);
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
        dynPropValueRepo = module.get(getRepositoryToken(MenuItemDynamicPropertyValue));

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

    it('successfully validate create: no validation errors', async () => {
        const category = categories[0];
        const containedItem1 = singleItems[0];
        const containedItem2 = singleItems[1];

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-container`,
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: category.id,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem1.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem2.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: singleItems[0].name,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: containerMenuItems and not set to type container', async () => {
        const containedItem = singleItems[0];

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-item`,
            type: MENU_ITEM_TYPES.SINGLE,
            sizeIds: sizes.map((s) => s.id),
            categoryId: null,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate create: containerMenuItems errors: duplicate container item', async () => {
        const containedItem = singleItems[0];

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-container`,
            type: MENU_ITEM_TYPES.CONTAINER,
            sizeIds: sizes.map((s) => s.id),
            categoryId: null,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerMenuItems']),
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: contained item not of type single', async () => {
        const containerItem = fixedContainerItems[0];

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-container`,
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: null,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containerItem.id,
                    containedItemSizeId: sizes[2].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: contained item size not valid', async () => {
        const containedItem = singleItems[0];
        // singleItems[0] has sizes[0] and sizes[1]; sizes[2] is invalid
        const invalidSize = sizes[2];

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-container`,
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: null,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: quantity with value 0', async () => {
        const containedItem = singleItems[0];

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-container`,
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: null,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 0,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('successfully validate update with no validation errors', async () => {
        // varContainerItems[1] = container_d which has containerLines with singleItems[2] and singleItems[3]
        const itemToUpdate = await itemRepo.findOneOrFail({
            where: { id: varContainerItems[1].id },
            relations: ['sizes', 'containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize', 'category'],
        });
        if (!itemToUpdate.containerMenuItems?.length) {
            throw new Error('item container menu items not found');
        }
        const containedItem = singleItems[0];

        const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: `${P}-updated-container`,
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: categories[0].id,
            variableMaxAmount: 6,
            sizeIds: itemToUpdate.sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedUpdateMenuItemContainerItemDto, {
                    id: itemToUpdate.containerMenuItems[0].id,
                    quantity: 6,
                    containedMenuItemId: itemToUpdate.containerMenuItems[0].containedMenuItem.id,
                    containedItemSizeId: itemToUpdate.containerMenuItems[0].containedItemSize.id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 6,
                    parentItemSizeId: itemToUpdate.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const itemToUpdate = await itemRepo.findOneOrFail({
            where: { id: singleItems[0].id },
            relations: ['category', 'sizes', 'containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize'],
        });
        const dto = menuItemToUpdateDto(itemToUpdate, { name: singleItems[1].name });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: containerMenuItems and not set to type container', async () => {
        const singleItem = await itemRepo.findOneOrFail({
            where: { id: singleItems[0].id },
            relations: ['category', 'sizes'],
        });
        const containedItem = singleItems[1];

        const dto = menuItemToUpdateDto(singleItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: singleItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, singleItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate update: containerMenuItems errors: duplicate container item', async () => {
        const containerItem = await itemRepo.findOneOrFail({
            where: { id: fixedContainerItems[0].id },
            relations: ['category', 'sizes'],
        });
        const containedItem = singleItems[0];

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id ?? null,
            sizeIds: containerItem.sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerMenuItems']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: contained item not of type single', async () => {
        const containerItem = await itemRepo.findOneOrFail({
            where: { id: fixedContainerItems[1].id },
            relations: ['category', 'sizes'],
        });
        const anotherContainer = fixedContainerItems[0];

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id ?? null,
            sizeIds: containerItem.sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: sizes[2].id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: contained item size not valid', async () => {
        const containerItem = await itemRepo.findOneOrFail({
            where: { id: fixedContainerItems[0].id },
            relations: ['category', 'sizes'],
        });
        const containedItem = singleItems[0];
        // singleItems[0] has sizes[0] and sizes[1]; sizes[2] is invalid
        const invalidSize = sizes[2];

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id ?? null,
            sizeIds: containerItem.sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: quantity with value 0', async () => {
        const containerItem = await itemRepo.findOneOrFail({
            where: { id: fixedContainerItems[0].id },
            relations: ['category', 'sizes'],
        });
        const containedItem = singleItems[0];

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id ?? null,
            sizeIds: containerItem.sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: 0,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const varContainer = await itemRepo.findOneOrFail({
            where: { id: varContainerItems[0].id },
            relations: ['category', 'sizes'],
        });
        if (!varContainer.variableMaxAmount) throw new Error('variable max amount not found');

        const containedItem = singleItems[0];

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: varContainer.name,
            type: varContainer.type,
            categoryId: varContainer.category?.id ?? null,
            variableMaxAmount: varContainer.variableMaxAmount,
            sizeIds: varContainer.sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: sizes[0].id,
                    quantity: varContainer.variableMaxAmount + 1,
                    parentItemSizeId: varContainer.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, varContainer.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('successfully validate create: valid dynamicProperties entry passes validation', async () => {
        const config = await configRepo.save({
            holderEntityType: HolderEntityType.MenuItem,
            holderCategory: null,
            propertyName: `${P}-test-filepath-prop`,
            valueType: ValueType.Filepath,
            valueEntityType: null,
            valueEntityCategory: null,
        });
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

        const dto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-new-item-with-dp`,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
            dynamicProperties: [{ configId: config.id, value: '/path/to/file' }],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: dynamicProperties unknown configId returns validation error', async () => {
        const dto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-unknown-config-item`,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
            dynamicProperties: [{ configId: 999999, value: null }],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'dynamicProperties', id: 999999 }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['configId']),
        );
    });

    it('fail validate create: config holderCategoryId does not match menuItem category', async () => {
        const catA = categories[0];
        const catB = categories[1];

        const config = await configRepo.save({
            holderEntityType: HolderEntityType.MenuItem,
            holderCategory: catA,
            propertyName: `${P}-test-category-scoped-prop`,
            valueType: ValueType.Filepath,
            valueEntityType: null,
            valueEntityCategory: null,
        });
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

        const dto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-category-mismatch-item`,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: catB.id,
            sizeIds: [sizes[0].id],
            dynamicProperties: [{ configId: config.id, value: '/path/file' }],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'dynamicProperties', id: config.id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['configId']),
        );
    });

    it('fail validate create: value entity does not belong to required valueEntityCategoryId', async () => {
        const catA = categories[0];
        const catB = categories[1];

        const valueItem = await itemRepo.findOneOrFail({ where: { category: { id: catB.id } } });

        const config = await configRepo.save({
            holderEntityType: HolderEntityType.MenuItem,
            holderCategory: null,
            propertyName: `${P}-test-entity-ref-prop`,
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
            valueEntityCategory: catA,
        });
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

        const dto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-value-cat-mismatch`,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
            dynamicProperties: [{ configId: config.id, value: String(valueItem.id) }],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'dynamicProperties', id: config.id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['value']),
        );
    });

    it('fail validate update: changing categoryId when stale dynamic property value rows exist', async () => {
        const catA = categories[0];
        const catB = categories[1];

        const menuItem = await itemRepo.findOneOrFail({
            where: { category: { id: catA.id }, type: MENU_ITEM_TYPES.SINGLE },
        });

        const config = await configRepo.save({
            holderEntityType: HolderEntityType.MenuItem,
            holderCategory: catA,
            propertyName: `${P}-test-stale-guard-prop`,
            valueType: ValueType.Filepath,
            valueEntityType: null,
            valueEntityCategory: null,
        });
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

        const dpValue = await dynPropValueRepo.save({
            menuItem: { id: menuItem.id },
            config: { id: config.id },
            valueText: '/some/file',
            valueEntity: null,
        });
        testCtx.addCleanupFunction(async () => { await dynPropValueRepo.delete(dpValue.id); });

        const dto = plainToInstance(UpdateMenuItemDto, {
            name: menuItem.name,
            type: menuItem.type,
            categoryId: catB.id,
            sizeIds: [sizes[0].id],
        });

        const errors = await validator.validateDto(dto, menuItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['categoryId']),
        );
    });
});
