import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_container_a, item_container_b, item_var_max_container_c, item_var_max_container_d } from '../../menu-items/utils/constants';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
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
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;

    const findMenuItem = async (name: string) => {
        return await menuItemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize', 'containerMenuItems.parentItemSize'] });
    }

    const findContainerMenuItem = async (name: string) => {
        return await menuItemRepo.findOneOrFail({
            where: { name, type: MENU_ITEM_TYPES.CONTAINER }, relations: ['sizes',
                'containerMenuItems',
                'containerMenuItems.containedMenuItem',
                'containerMenuItems.containedItemSize',]
        });
    }

    const findOrderMenuItem = async () => {
        return await orderItemRepo.findOneOrFail({ where: {}, relations: ['menuItem', 'size', 'menuItem.containerMenuItems', 'menuItem.sizes'] });
    }

    const getValidContainerMenuItems = async (containerId: number, sizeId: number) => {
        return await menuItemContainerItemRepo.find({
            where: {
                parentMenuItem: { id: containerId },
                parentItemSize: { id: sizeId },
            },
            relations: ['containedMenuItem', 'containedItemSize', 'containedMenuItem.sizes'],
        });
    }

    const findContainerOrderMenuItem = async () => {
        return await orderItemRepo.findOneOrFail({ where: { menuItem: { type: MENU_ITEM_TYPES.CONTAINER } }, relations: ['menuItem', 'size', 'menuItem.containerMenuItems', 'menuItem.sizes'] });
        /*return await orderItemRepos
            .createQueryBuilder('orderItem')
            .innerJoinAndSelect('orderItem.menuItem', 'menuItem')
            .innerJoinAndSelect('menuItem.containerMenuItems', 'containerMenuItems')
            .leftJoinAndSelect('containerMenuItems.containedMenuItem', 'containedMenuItem')
            .leftJoinAndSelect('containerMenuItems.containedItemSize', 'containedItemSize')
            .leftJoinAndSelect('orderItem.size', 'size')
            .where('menuItem.type = :type', { type: MENU_ITEM_TYPES.CONTAINER })
            .getOneOrFail();*/
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
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const order = await orderRepo.findOne({ where: {} });
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_container_a);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }
        const containerSize = containerMenuItem.sizes[0];

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerSize.id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

        const containedItem1 = validContainerMenuItems[0];
        const containedItem2 = validContainerMenuItems[1];

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId:
                        containedItem1.containedMenuItem.id,
                    containedItemSizeId:
                        containedItem1.containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId:
                        containedItem2.containedMenuItem.id,
                    containedItemSizeId:
                        containedItem2.containedItemSize.id,
                    quantity: 3,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: invalid size', async () => {
        const order = await orderRepo.findOne({ where: {} });
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

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: menuItem.id,
            sizeId: invalidSize.id,
            quantity: 1,
            parentOrderId: order.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['size']));
    });

    it('fail validate create: duplicate container item', async () => {
        const order = await orderRepo.findOne({ where: {} });
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_var_max_container_c);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem1 = validContainerMenuItems[0];

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem1.containedMenuItem.id,
                    containedItemSizeId: containedItem1.containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount - 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem1.containedMenuItem.id,
                    containedItemSizeId: containedItem1.containedItemSize.id,
                    quantity: 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate create: container quantity not equal to variable max amount', async () => {
        const order = await orderRepo.findOne({ where: {} });
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_var_max_container_c);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem1 = validContainerMenuItems[0];
        const containedItem2 = validContainerMenuItems[1];

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem1.containedMenuItem.id,
                    containedItemSizeId: containedItem1.containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const order = await orderRepo.findOne({ where: {} });
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_container_a);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem =
            validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;
        const invalidSize = containedItem.sizes.find(
            (s) => s.id !== containedItemSize.id,
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const order = await orderRepo.findOne({ where: {} });
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await findMenuItem(item_container_b);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem = validContainerMenuItems[0];

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.containedMenuItem.id,
                    containedItemSizeId: containedItem.containedItemSize.id,
                    quantity: 0,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate create: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const order = await orderRepo.findOne({ where: {} });
        if (!order) {
            throw new Error('order not found');
        }

        const containerMenuItem = await menuItemRepo.findOneOrFail({
            where: { name: item_var_max_container_d },
            relations: ['containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize', 'sizes'],
        });

        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem = validContainerMenuItems[0];

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerMenuItem.sizes[0].id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.containedMenuItem.id,
                    containedItemSizeId: containedItem.containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const orderMenuItemToUpdate = await findOrderMenuItem();

        const newContainerItem = await findContainerMenuItem(item_var_max_container_c);
        if (!newContainerItem.containerMenuItems) {
            throw new Error('new container item container menu items not found');
        }
        if (!newContainerItem.variableMaxAmount) {
            throw new Error('new container item does not have variableMaxAmount');
        }

        let newQuantity = 5;
        if (newContainerItem.variableMaxAmount) {
            newQuantity = newContainerItem.variableMaxAmount;
        }

        const validContainerMenuItems = await getValidContainerMenuItems(newContainerItem.id, newContainerItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem1 = validContainerMenuItems[0];
        const containedItem2 = validContainerMenuItems[1];

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            quantity: 5,
            menuItemId: newContainerItem.id,
            sizeId: newContainerItem.sizes[0].id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId:
                        containedItem1.containedMenuItem.id,
                    containedItemSizeId:
                        containedItem1.containedItemSize.id,
                    quantity: newContainerItem.variableMaxAmount - 1,
                    parentMenuItemIdCtx: newContainerItem.id,
                    parentMenuItemSizeIdCtx: newContainerItem.sizes[0].id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId:
                        containedItem2.containedMenuItem.id,
                    containedItemSizeId:
                        containedItem2.containedItemSize.id,
                    quantity: 1,
                    parentMenuItemIdCtx: newContainerItem.id,
                    parentMenuItemSizeIdCtx: newContainerItem.sizes[0].id,
                }),
            ],
        });

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

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            sizeId: invalidSize.id,
            menuItemId: orderMenuItemToUpdate.menuItem.id,
            quantity: orderMenuItemToUpdate.quantity,
            containerOrderMenuItems: [],
        });

        const errors = await validator.validateDto(
            dto,
            orderMenuItemToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['size']));
    });

    it('fail validate update: duplicate container item', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();
        if (!containerOrderMenuItem.size) {
            throw new Error('container order menu item size not found');
        }
        if (!containerOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('container order menu item container menu items not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerOrderMenuItem.menuItem.id, containerOrderMenuItem.size.id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem = validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 3,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: container quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOneOrFail({
            where: {
                menuItem: { name: item_var_max_container_c },
            },
            relations: ['menuItem', 'menuItem.containerMenuItems', 'menuItem.containerMenuItems.containedMenuItem', 'menuItem.containerMenuItems.containedItemSize', 'size'],
        });
        if (!containerOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('container order menu item container menu items not found');
        }
        if (!containerOrderMenuItem.menuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }
        if (!containerOrderMenuItem.size) {
            throw new Error('container order menu item size not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerOrderMenuItem.menuItem.id, containerOrderMenuItem.size.id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem = validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerOrderMenuItem.menuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();
        if (!containerOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('container order menu item container menu items not found');
        }
        if (!containerOrderMenuItem.size) {
            throw new Error('container order menu item size not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerOrderMenuItem.menuItem.id, containerOrderMenuItem.size.id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
        const containedItem = validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;
        const invalidSize = containedItem.sizes.find(
            (s) => s.id !== containedItemSize.id,
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'containerOrderMenuItems', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const containerOrderMenuItem = await findContainerOrderMenuItem();
        if (!containerOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('container order menu item container menu items not found');
        }
        if (!containerOrderMenuItem.size) {
            throw new Error('container order menu item size not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerOrderMenuItem.menuItem.id, containerOrderMenuItem.size.id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

        const containedItem =
            validContainerMenuItems[0].containedMenuItem;
        const containedItemSize =
            validContainerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedUpdateOrderContainerItemDto, {
                    id: containerOrderMenuItem.menuItem.containerMenuItems[0].id,
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: 0,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                }), ,
            ],
        });

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: containerOrderMenuItem.menuItem.containerMenuItems[0].id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: parent with variable max amount and container quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await orderItemRepo.findOneOrFail({
            where: {
                menuItem: { name: item_var_max_container_c },
            },
            relations: ['menuItem', 'menuItem.containerMenuItems', 'menuItem.containerMenuItems.containedMenuItem', 'menuItem.containerMenuItems.containedItemSize', 'size'],
        });
        if (!containerOrderMenuItem.menuItem.containerMenuItems) {
            throw new Error('container order menu item container menu items not found');
        }
        if (!containerOrderMenuItem.size) {
            throw new Error('container order menu item size not found');
        }
        if (!containerOrderMenuItem.menuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerOrderMenuItem.menuItem.id, containerOrderMenuItem.size.id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

        const containedItem =
            validContainerMenuItems[0].containedMenuItem;
        const containedItemSize =
            validContainerMenuItems[0].containedItemSize;

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: containerOrderMenuItem.menuItem.id,
            sizeId: containerOrderMenuItem.size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedUpdateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItemSize.id,
                    quantity: containerOrderMenuItem.menuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerOrderMenuItem.menuItem.id,
                    parentMenuItemSizeIdCtx: containerOrderMenuItem.size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(
            dto,
            containerOrderMenuItem.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });
});
