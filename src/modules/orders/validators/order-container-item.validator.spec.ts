import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_container_a, item_container_b } from '../../menu-items/utils/constants';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemValidator } from './order-container-item.validator';

describe('order container item validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderContainerItemValidator;
    let containerItemRepo: Repository<OrderContainerItem>;
    let orderItemRepo: Repository<OrderMenuItem>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;

    const findOrderMenuItem = async (name: string) => {
        return await orderItemRepo.findOneOrFail({ where: { menuItem: { name } }, relations: ['menuItem', 'size', 'menuItem.containerMenuItems', 'menuItem.sizes', 'menuItem.containerMenuItems.containedMenuItem', 'menuItem.containerMenuItems.containedItemSize'] });
    }

    const findContainerItem = async () => {
        return await containerItemRepo.findOneOrFail({
            where: {},
            relations: [
                'containedMenuItem',
                'containedItemSize',
                'parentOrderMenuItem',
                'parentOrderMenuItem.menuItem',
            ],
        });
    }

    const findMenuItem = async (name: string) => {
        return await menuItemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'containerMenuItems'] });
    }

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        validator = module.get<OrderContainerItemValidator>(
            OrderContainerItemValidator,
        );

        containerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
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
        const parentOrderMenuItem = await findOrderMenuItem(item_container_a);
        if (!parentOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('parent order menu item container menu items not found');
        }

        const containedItem =
            parentOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            parentOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: CreateOrderContainerItemDto = plainToInstance(CreateOrderContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItemSize.id,
            quantity: 2,
            parentOrderMenuItemId: parentOrderMenuItem.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: contained item not of type single', async () => {
        const parentOrderMenuItem = await findOrderMenuItem(item_container_b);

        const containerItem = await menuItemRepo.findOneOrFail({
            where: { name: item_container_a },
            relations: ['sizes'],
        });

        const dto: CreateOrderContainerItemDto = plainToInstance(CreateOrderContainerItemDto, {
            containedMenuItemId: containerItem.id,
            containedItemSizeId: containerItem.sizes[0].id,
            quantity: 2,
            parentOrderMenuItemId: parentOrderMenuItem.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']),
        );
    });

    // TODO create fail: invalid containerMenuitem

    // TODO create fail: invalid container item size

    // TODO create fail: Invalid parent order menu item
    it('fail validate create: quantity with value 0', async () => {
        const parentOrderMenuItem = await findOrderMenuItem(item_container_a);
        if (!parentOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('parent order menu item container menu items not found');
        }

        const containedItem =
            parentOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            parentOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: CreateOrderContainerItemDto = plainToInstance(CreateOrderContainerItemDto, {
            containedMenuItemId: containedItem.id,
            containedItemSizeId: containedItemSize.id,
            quantity: 0,
            parentOrderMenuItemId: parentOrderMenuItem.id,
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
        const parentMenuItem = await menuItemRepo.findOne({
            where: { id: containerItemToUpdate.parentOrderMenuItem.menuItem.id },
            relations: ['sizes', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize'],
        });
        if (!parentMenuItem) {
            throw new Error('parent menu item not found');
        }

        const newItem = parentMenuItem.containerMenuItems?.find(item => item.id !== containerItemToUpdate.containedMenuItem.id);
        if (!newItem) {
            throw new Error('new item not found');
        }

        const dto: UpdateOrderContainerItemDto = plainToInstance(UpdateOrderContainerItemDto, {
            containedMenuItemId: newItem.containedMenuItem.id,
            containedItemSizeId: newItem.containedItemSize.id,
            quantity: containerItemToUpdate.quantity,
        });

        const errors = await validator.validateDto(
            dto,
            containerItemToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: contained item not of type single', async () => {
        const containerItemToUpdate = await findContainerItem();

        const containerItem = await menuItemRepo.findOne({
            where: { type: MENU_ITEM_TYPES.CONTAINER },
            relations: ['sizes'],
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }
        if (!containerItem.sizes || containerItem.sizes.length === 0) {
            throw new Error('container item sizes not found');
        }

        const dto: UpdateOrderContainerItemDto = plainToInstance(UpdateOrderContainerItemDto, {
            containedMenuItemId: containerItem.id,
            containedItemSizeId: containerItem.sizes[0].id,
            quantity: 2,
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

    // TODO update fail: invalid containerMenuitem

    // TODO update fail: invalid container item size

    // TODO update fail: Invalid parent order menu item

    it('fail validate update: quantity with value 0', async () => {
        const containerItemToUpdate = await containerItemRepo.findOne({ where: {} });
        if (!containerItemToUpdate) {
            throw new Error('container item not found');
        }

        const dto: UpdateOrderContainerItemDto = plainToInstance(UpdateOrderContainerItemDto, {
            quantity: 0,
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
