import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_f, item_g } from '../../menu-items/utils/constants';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemValidator } from './order-menu-item.validator';

describe('order menu item validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderMenuItemValidator;
    let orderItemRepo: Repository<OrderMenuItem>;
    let orderContainerItemRepo: Repository<OrderContainerItem>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let orderRepo: Repository<Order>;

    const findMenuItem = async (name: string) => {
        return await menuItemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'containerMenuItems'] });
    }

    const findContainerMenuItem = async () => {
        return await menuItemRepo.findOneOrFail({
            where: { type: MENU_ITEM_TYPES.CONTAINER }, relations: ['sizes',
                'containerMenuItems',
                'containerMenuItems.containedMenuItem',
                'containerMenuItems.containedItemSize',]
        });
    }

    const findOrderMenuItem = async () => {
        return await orderItemRepo.findOneOrFail({ relations: ['menuItem', 'size', 'menuItem.containerMenuItems', 'menuItem.sizes'] });
    }

    const findContainerOrderMenuItem = async () => {
        return await orderItemRepo.findOneOrFail({
            relations: ['menuItem', 'menuItem.containerMenuItems', 'size'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
    }

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        validator = module.get<OrderMenuItemValidator>(OrderMenuItemValidator);

        orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderContainerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        orderRepo = module.get(getRepositoryToken(Order));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId:
                        containerMenuItem.containerMenuItems[0].containedMenuItem.id,
                    containedItemSizeId:
                        containerMenuItem.containerMenuItems[0].containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
                {
                    createId: 'c2',
                    containedMenuItemId:
                        containerMenuItem.containerMenuItems[1]?.containedMenuItem.id ||
                        containerMenuItem.containerMenuItems[0].containedMenuItem.id,
                    containedItemSizeId:
                        containerMenuItem.containerMenuItems[1]?.containedItemSize.id ||
                        containerMenuItem.containerMenuItems[0].containedItemSize.id,
                    quantity: 3,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: invalid size', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const menuItem = await findMenuItem(item_a);

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !menuItem.sizes?.some((ms) => ms.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateOrderMenuItemDto = {
            menuItemId: menuItem.id,
            sizeId: invalidSize.id,
            quantity: 1,
            parentOrderId: order.id,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['size']));
    });

    it('fail validate create: duplicate container item', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);

        const containedItem =
            containerMenuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerMenuItem.containerMenuItems[0].containedItemSize;

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 3,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate create: container quantity not equal to variable max amount', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);

        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const containedItem =
            containerMenuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerMenuItem.containerMenuItems[0].containedItemSize;

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' },],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['quantity']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: contained item not of type single', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);

        const anotherContainer = await findMenuItem(item_g);

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: anotherContainer.sizes[0].id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['type']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);

        const containedItem =
            containerMenuItem.containerMenuItems[0].containedMenuItem;
        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['containedItemSize']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);

        const containedItem =
            containerMenuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerMenuItem.containerMenuItems[0].containedItemSize;

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 0,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['quantity']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_f);
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const containedItem =
            containerMenuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerMenuItem.containerMenuItems[0].containedItemSize;

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['quantity']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const orderMenuItemToUpdate = await findOrderMenuItem();

        const newContainerItem = await findContainerMenuItem();

        let newQuantity = 5;
        if (newContainerItem.variableMaxAmount) {
            newQuantity = newContainerItem.variableMaxAmount;
        }

        const dto: UpdateOrderMenuItemDto = {
            quantity: 5,
            menuItemId: newContainerItem.id,
            sizeId: newContainerItem.sizes[0].id,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId:
                        newContainerItem.containerMenuItems[0].containedMenuItem.id,
                    containedItemSizeId:
                        newContainerItem.containerMenuItems[0].containedItemSize.id,
                    quantity: newQuantity,
                    parentMenuItemIdCtx: newContainerItem.id,
                    parentMenuItemSizeIdCtx: newContainerItem.sizes[0].id,
                },
                {
                    createId: 'c2',
                    containedMenuItemId:
                        newContainerItem.containerMenuItems[1].containedMenuItem.id,
                    containedItemSizeId:
                        newContainerItem.containerMenuItems[1].containedItemSize.id,
                    quantity: newQuantity,
                    parentMenuItemIdCtx: newContainerItem.id,
                    parentMenuItemSizeIdCtx: newContainerItem.sizes[0].id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            orderMenuItemToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: invalid size', async () => {
        const orderMenuItemToUpdate = await findOrderMenuItem();

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) =>
                !orderMenuItemToUpdate.menuItem.sizes?.some((ms) => ms.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: UpdateOrderMenuItemDto = {
            sizeId: invalidSize.id,
            menuItemId: orderMenuItemToUpdate.menuItem.id,
            quantity: orderMenuItemToUpdate.quantity,
            containerOrderMenuItems: [],
        };

        const errors = await validator.validateDto(
            dto,
            orderMenuItemToUpdate.id,
        );
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['size']));
    });

    it('fail validate update: duplicate container item', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 3,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: container quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();
        if (!containerOrderMenuItem.menuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerOrderMenuItem.menuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: contained item not of type single', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();

        const anotherContainer = await findMenuItem(item_g);

        const dto: UpdateOrderMenuItemDto = {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: anotherContainer.sizes[0].id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'containerOrderMenuItems', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['containedMenuItem']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: UpdateOrderMenuItemDto = {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'containerOrderMenuItems', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['containedItemSize']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 0,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['quantity']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();
        if (!containerOrderMenuItem.menuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerOrderMenuItem.menuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                },
            ],
        };

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['quantity']),
        );
    });
});
