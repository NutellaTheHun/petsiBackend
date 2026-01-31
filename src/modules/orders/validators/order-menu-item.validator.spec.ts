import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
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

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes', 'containerMenuItems'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }
        if (
            !containerMenuItem.containerMenuItems ||
            containerMenuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

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
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expect(errors).toBeNull();
    });

    it('fail validate create: invalid size', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const menuItem = await menuItemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!menuItem) {
            throw new Error('menu item not found');
        }

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

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(errors, [{ prop: 'size' }], 'Invalid size');
    });

    it('fail validate create: container must have at least one item', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }

        const dto: CreateOrderMenuItemDto = {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems' }],
            'container must have at least one item',
        );
    });

    it('fail validate create: duplicate container item', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes', 'containerMenuItems'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }
        if (
            !containerMenuItem.containerMenuItems ||
            containerMenuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
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
                    quantity: 2,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 3,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            'duplicate container item',
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c2' }],
            'duplicate container item',
        );
    });

    it('fail validate create: container quantity not equal to variable max amount', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes', 'containerMenuItems'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }
        if (
            !containerMenuItem.containerMenuItems ||
            containerMenuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
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
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'quantity' }],
            'quantity must equal the variable max amount of the container',
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: contained item not of type single', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }

        const anotherContainer = await menuItemRepo.findOne({
            where: { name: item_g },
            relations: ['sizes'],
        });
        if (!anotherContainer) {
            throw new Error('another container not found');
        }
        if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
            throw new Error('another container sizes not found');
        }

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
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }, { prop: 'type' }],
            'Only items of type single can be in a container',
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes', 'containerMenuItems'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }
        if (
            !containerMenuItem.containerMenuItems ||
            containerMenuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

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
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'containerOrderMenuItems', id: 'c1' },
                { prop: 'containedItemSize' },
            ],
            'Invalid size',
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes', 'containerMenuItems'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }
        if (
            !containerMenuItem.containerMenuItems ||
            containerMenuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
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
                    quantity: 0,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'quantity must be greater than 0',
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const order = await orderRepo.findOne({});
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOne({
            where: { name: item_f },
            relations: ['sizes', 'containerMenuItems'],
        });
        if (!containerMenuItem) {
            throw new Error('container menu item not found');
        }
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }
        if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
            throw new Error('container menu item sizes not found');
        }
        if (
            !containerMenuItem.containerMenuItems ||
            containerMenuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
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
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'quantity must be less than or equal to the variable max amount',
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const orderMenuItemToUpdate = await orderItemRepo.findOne({
            relations: ['menuItem', 'size', 'containerOrderMenuItems'],
        });
        if (!orderMenuItemToUpdate) {
            throw new Error('order menu item not found');
        }

        const newContainerItem = await menuItemRepo.findOne({
            where: { type: MENU_ITEM_TYPES.CONTAINER },
            relations: [
                'sizes',
                'containerMenuItems',
                'containerMenuItems.containedMenuItem',
                'containerMenuItems.containedItemSize',
            ],
        });
        if (!newContainerItem) {
            throw new Error('new container item not found');
        }
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
                },
                {
                    createId: 'c2',
                    containedMenuItemId:
                        newContainerItem.containerMenuItems[1].containedMenuItem.id,
                    containedItemSizeId:
                        newContainerItem.containerMenuItems[1].containedItemSize.id,
                    quantity: newQuantity,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            orderMenuItemToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: invalid size', async () => {
        const orderMenuItemToUpdate = await orderItemRepo.findOne({
            relations: ['menuItem', 'size'],
        });
        if (!orderMenuItemToUpdate) {
            throw new Error('order menu item not found');
        }

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
        };

        const errors = await validator.validateUpdateNode(
            dto,
            orderMenuItemToUpdate.id,
        );
        expectValidationErrorPayload(errors, [{ prop: 'size' }], 'Invalid size');
    });

    it('fail validate update: duplicate container item', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOne({
            relations: ['menuItem', 'menuItem.containerMenuItems'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
        if (!containerOrderMenuItem) {
            throw new Error('container order menu item not found');
        }
        if (
            !containerOrderMenuItem.menuItem.containerMenuItems ||
            containerOrderMenuItem.menuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 2,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 3,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            'duplicate container item',
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c2' }],
            'duplicate container item',
        );
    });

    it('fail validate update: container quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOne({
            relations: ['menuItem', 'menuItem.containerMenuItems'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
        if (!containerOrderMenuItem) {
            throw new Error('container order menu item not found');
        }
        if (!containerOrderMenuItem.menuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }
        if (
            !containerOrderMenuItem.menuItem.containerMenuItems ||
            containerOrderMenuItem.menuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerOrderMenuItem.menuItem.variableMaxAmount + 1,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'quantity' }],
            'quantity must equal the variable max amount of the container',
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: contained item not of type single', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOne({
            relations: ['menuItem'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
        if (!containerOrderMenuItem) {
            throw new Error('container order menu item not found');
        }

        const anotherContainer = await menuItemRepo.findOne({
            where: { name: item_g },
            relations: ['sizes'],
        });
        if (!anotherContainer) {
            throw new Error('another container not found');
        }
        if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
            throw new Error('another container sizes not found');
        }

        const dto: UpdateOrderMenuItemDto = {
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: anotherContainer.sizes[0].id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'containerOrderMenuItems', id: 'c1' },
                { prop: 'containedMenuItem' },
            ],
            'contained item must be of type single',
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOne({
            relations: ['menuItem', 'menuItem.containerMenuItems'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
        if (!containerOrderMenuItem) {
            throw new Error('container order menu item not found');
        }
        if (
            !containerOrderMenuItem.menuItem.containerMenuItems ||
            containerOrderMenuItem.menuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

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
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'containerOrderMenuItems', id: 'c1' },
                { prop: 'containedItemSize' },
            ],
            'Invalid size',
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOne({
            relations: ['menuItem', 'menuItem.containerMenuItems'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
        if (!containerOrderMenuItem) {
            throw new Error('container order menu item not found');
        }
        if (
            !containerOrderMenuItem.menuItem.containerMenuItems ||
            containerOrderMenuItem.menuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 0,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'quantity must be greater than 0',
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOne({
            relations: ['menuItem', 'menuItem.containerMenuItems'],
            where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } },
        });
        if (!containerOrderMenuItem) {
            throw new Error('container order menu item not found');
        }
        if (!containerOrderMenuItem.menuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }
        if (
            !containerOrderMenuItem.menuItem.containerMenuItems ||
            containerOrderMenuItem.menuItem.containerMenuItems.length === 0
        ) {
            throw new Error('container menu items not found');
        }

        const containedItem =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedMenuItem;
        const containedItemSize =
            containerOrderMenuItem.menuItem.containerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = {
            containerOrderMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerOrderMenuItem.menuItem.variableMaxAmount + 1,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'quantity must be equal to the variable max amount',
        );
    });
});
