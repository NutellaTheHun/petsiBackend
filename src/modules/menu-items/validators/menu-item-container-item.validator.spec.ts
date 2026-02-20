import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IsNull, Not, Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_b, item_f, item_g } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

describe('menu item container item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let validator: MenuItemContainerItemValidator;

    let containerItemRepo: Repository<MenuItemContainerItem>;
    let itemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;

    const findMenuItem = async (name: string) => {
        return await itemRepo.findOneOrFail({ where: { name }, relations: ['sizes'] });
    }

    const findContainerItem = async () => {
        return await containerItemRepo.findOneOrFail({
            relations: [
                'containedMenuItem',
                'containedItemSize',
                'parentMenuItem',
                'parentItemSize',
            ],
        });
    }

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

        validator = module.get<MenuItemContainerItemValidator>(
            MenuItemContainerItemValidator,
        );

        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        itemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const parentContainer = await findMenuItem(item_f);
        const containedItem = await findMenuItem(item_a);

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItem.sizes[0].id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: parentContainer.sizes[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: contained item not of type single', async () => {
        const parentContainer = await findMenuItem(item_f);
        const containedContainer = await findMenuItem(item_g);

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedContainer.id,
            containedItemSizeId: containedContainer.sizes[0].id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: parentContainer.sizes[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']),
        );
    });

    it('fail validate create: invalid contained item size', async () => {
        const parentContainer = await findMenuItem(item_f);
        const containedItem = await findMenuItem(item_a);

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: invalidSize.id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: parentContainer.sizes[0].id,
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
        const parentContainer = await findMenuItem(item_f);
        const containedItem = await findMenuItem(item_a);

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItem.sizes[0].id,
            quantity: 0,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: parentContainer.sizes[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']));
    });

    it('fail validate create: parent item not of type container', async () => {
        const singleItem = await findMenuItem(item_a);
        const containedItem = await findMenuItem(item_b);

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItem.sizes[0].id,
            quantity: 2,
            parentMenuItemId: singleItem.id,
            parentItemSizeId: singleItem.sizes[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['parentMenuItem']),
        );
    });

    it('fail validate create: invalid parent item size', async () => {
        const parentContainer = await findMenuItem(item_f);
        const containedItem = await findMenuItem(item_a);

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !parentContainer.sizes?.some((ps) => ps.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItem.sizes[0].id,
            quantity: 2,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: invalidSize.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['parentItemSize']),
        );
    });

    it('fail validate create: parent with variable max amount and quantity not equal to variable max amount', async () => {
        // get containers where variableMaxAmount is not null
        const variableContainers = await itemRepo.find({
            where: { variableMaxAmount: Not(IsNull()) },
            relations: ['sizes'],
        });
        if (variableContainers.length === 0) {
            throw new Error('variable containers not found');
        }

        const parentContainer = variableContainers[0];
        if (!parentContainer) {
            throw new Error('parent container not found');
        }
        if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
            throw new Error('parent container sizes not found');
        }
        if (!parentContainer.variableMaxAmount) {
            throw new Error('parent container does not have variableMaxAmount');
        }

        const containedItem = await findMenuItem(item_a);

        const dto: CreateMenuItemContainerItemDto = plainToInstance(CreateMenuItemContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItem.sizes[0].id,
            quantity: parentContainer.variableMaxAmount + 1,
            parentMenuItemId: parentContainer.id,
            parentItemSizeId: parentContainer.sizes[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const containerItemToUpdate = await findContainerItem();
        const newItem = await findMenuItem(item_a);

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: newItem.id,
            containedItemSizeId: newItem.sizes[0].id,
            quantity: 5,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: contained item not of type single', async () => {
        const containerItemToUpdate = await findContainerItem();

        const containerItem = await itemRepo.findOneOrFail({
            where: { type: MENU_ITEM_TYPES.CONTAINER },
        });

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: containerItem.id,
            containedItemSizeId: containerItemToUpdate.containedItemSize.id,
            quantity: containerItemToUpdate.quantity
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']),
        );
    });

    it('fail validate update: invalid contained item size (dto with itemSizeId, pre-existing contained item)', async () => {
        const containerItemToUpdate = await findContainerItem();
        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) =>
                !containerItemToUpdate.containedMenuItem.sizes?.some(
                    (cs) => cs.id === s.id,
                ),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedItemSizeId: invalidSize.id,
            quantity: containerItemToUpdate.quantity,
            containedMenuItemId: containerItemToUpdate.containedMenuItem.id,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: invalid contained item size (dto with itemSizeId, and containedItemId)', async () => {
        const containerItemToUpdate = await findContainerItem();
        const newContainedItem = await findMenuItem(item_b);
        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !newContainedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: newContainedItem.id,
            containedItemSizeId: invalidSize.id,
            quantity: containerItemToUpdate.quantity,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: quantity with value 0', async () => {
        const containerItemToUpdate = await findContainerItem();

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            quantity: 0,
            containedMenuItemId: containerItemToUpdate.containedMenuItem.id,
            containedItemSizeId: containerItemToUpdate.containedItemSize.id,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']));
    });

    it('fail validate update: parent menu item cannot be equal to contained menu item', async () => {
        const containerItemToUpdate = await findContainerItem();

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: containerItemToUpdate.parentMenuItem.id,
            containedItemSizeId: containerItemToUpdate.containedItemSize.id,
            quantity: containerItemToUpdate.quantity,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']),
        );
    });

    it('fail validate update: containedItemId item not of type single', async () => {
        const containerItemToUpdate = await findContainerItem();
        const containerItem = await itemRepo.findOne({
            where: { type: MENU_ITEM_TYPES.CONTAINER },
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            containedMenuItemId: containerItem.id,
            containedItemSizeId: containerItemToUpdate.containedItemSize.id,
            quantity: containerItemToUpdate.quantity,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']),
        );
    });

    it('fail validate update: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const containerItemToUpdate = await findContainerItem();
        if (!containerItemToUpdate.parentMenuItem.variableMaxAmount) {
            throw new Error('parent does not have variableMaxAmount');
        }

        const dto: UpdateMenuItemContainerItemDto = plainToInstance(UpdateMenuItemContainerItemDto, {
            quantity: containerItemToUpdate.parentMenuItem.variableMaxAmount + 1,
            containedMenuItemId: containerItemToUpdate.containedMenuItem.id,
            containedItemSizeId: containerItemToUpdate.containedItemSize.id,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });
});
