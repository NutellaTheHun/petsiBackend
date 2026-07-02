import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

const P = `t${Date.now()}`;

describe('menu item container item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let validator: MenuItemContainerItemValidator;

    let containerItemRepo: Repository<MenuItemContainerItem>;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    let categories: MenuItemCategory[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let sizes: MenuItemSize[];
    let containerLines: MenuItemContainerItem[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        validator = module.get<MenuItemContainerItemValidator>(MenuItemContainerItemValidator);
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ categories, singleItems, fixedContainerItems, varContainerItems, sizes, containerLines } =
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
        const parentContainer = fixedContainerItems[0];
        const containedItem = singleItems[0];
        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: sizes[0].id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: sizes[2].id,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: contained item not of type single', async () => {
        const parentContainer = fixedContainerItems[0];
        const containedContainer = fixedContainerItems[1];
        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedContainer.id,
            containedItemSizeId: sizes[2].id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: sizes[2].id,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate create: invalid contained item size', async () => {
        const parentContainer = fixedContainerItems[0];
        const containedItem = singleItems[0];
        // singleItems have sizes[0] and sizes[1]; sizes[2] is NOT in singleItems[0].sizes
        const invalidSize = sizes[2];
        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: invalidSize.id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: sizes[2].id,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate create: quantity with value 0', async () => {
        const parentContainer = fixedContainerItems[0];
        const containedItem = singleItems[0];
        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: sizes[0].id,
            quantity: 0,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: sizes[2].id,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']));
    });

    it('fail validate create: invalid parent item size', async () => {
        const parentContainer = fixedContainerItems[0];
        const containedItem = singleItems[0];
        // fixedContainerItems have sizes[2] and sizes[3]; sizes[0] is NOT in fixedContainerItems[0].sizes
        const invalidParentSize = sizes[0];
        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: sizes[0].id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: invalidParentSize.id,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['parentItemSize']),
        );
    });

    it('successfully validate update: no validation errors', async () => {
        const containerLine = containerLines[0];
        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: singleItems[0].id,
            containedItemSizeId: sizes[0].id,
            quantity: 5,
        });
        const errors = await validator.validateDto(dto, containerLine.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: contained item not of type single', async () => {
        const containerLine = containerLines[0];
        const containerItem = fixedContainerItems[0];
        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: containerItem.id,
            containedItemSizeId: sizes[2].id,
            quantity: containerLine.quantity,
        });
        const errors = await validator.validateDto(dto, containerLine.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate update: invalid contained item size (pre-existing contained item)', async () => {
        const containerLine = containerLines[0];
        // containerLine.containedMenuItem is a singleItem with sizes[0] and sizes[1]
        // sizes[2] is invalid for this contained item
        const invalidSize = sizes[2];
        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedItemSizeId: invalidSize.id,
            quantity: containerLine.quantity,
            containedMenuItemId: containerLine.containedMenuItem.id,
        });
        const errors = await validator.validateDto(dto, containerLine.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: invalid contained item size (new containedItemId)', async () => {
        const containerLine = containerLines[0];
        const newContainedItem = singleItems[1];
        // newContainedItem (singleItems[1]) has sizes[0] and sizes[1]; sizes[2] is invalid
        const invalidSize = sizes[2];
        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: newContainedItem.id,
            containedItemSizeId: invalidSize.id,
            quantity: containerLine.quantity,
        });
        const errors = await validator.validateDto(dto, containerLine.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: quantity with value 0', async () => {
        const containerLine = containerLines[0];
        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            quantity: 0,
            containedMenuItemId: containerLine.containedMenuItem.id,
            containedItemSizeId: containerLine.containedItemSize.id,
        });
        const errors = await validator.validateDto(dto, containerLine.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']));
    });

    it('fail validate update: containedItemId item not of type single', async () => {
        const containerLine = containerLines[0];
        const containerItemUsedAsContained = fixedContainerItems[0];
        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: containerItemUsedAsContained.id,
            containedItemSizeId: sizes[2].id,
            quantity: containerLine.quantity,
        });
        const errors = await validator.validateDto(dto, containerLine.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });
});
