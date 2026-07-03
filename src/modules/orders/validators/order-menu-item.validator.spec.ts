import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemValidator } from './order-menu-item.validator';

const P = `t${Date.now()}`;

describe('order menu item validator', () => {
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: OrderMenuItemValidator;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemCategoryRepo: Repository<MenuItemCategory>;

    let categories: OrderCategory[];
    let orders: Order[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let containerLines: MenuItemContainerItem[];
    let orderMenuItems: OrderMenuItem[];
    let containerOrderMenuItems: OrderMenuItem[];
    let menuItemCategories: MenuItemCategory[];
    let menuItemSizes: MenuItemSize[];

    const linesFor = (menuItemId: number, sizeId: number) =>
        containerLines.filter((l) => l.parentMenuItem.id === menuItemId && l.parentItemSize.id === sizeId);

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);

        validator = module.get<OrderMenuItemValidator>(OrderMenuItemValidator);

        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));

        ({ categories, orders, singleItems, fixedContainerItems, varContainerItems, containerLines, orderMenuItems, containerOrderMenuItems, menuItemCategories, menuItemSizes } =
            await testingUtil.seedOrderMenuItems(P));
    });

    afterAll(async () => {
        await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
        await orderRepo.delete(orders.map((o) => o.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await menuItemContainerItemRepo.delete(containerLines.map((l) => l.id));
        await menuItemRepo.delete([...singleItems, ...fixedContainerItems, ...varContainerItems].map((i) => i.id));
        await sizeRepo.delete(menuItemSizes.map((s) => s.id));
        await menuItemCategoryRepo.delete(menuItemCategories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const order = orders[0];
        const containerMenuItem = fixedContainerItems[0];
        const containerSize = containerMenuItem.sizes[0];
        const lines = linesFor(containerMenuItem.id, containerSize.id);

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerSize.id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: lines[1].containedMenuItem.id,
                    containedItemSizeId: lines[1].containedItemSize.id,
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
        const order = orders[0];
        const menuItem = singleItems[0];

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find((s) => !menuItem.sizes?.some((ms) => ms.id === s.id));
        if (!invalidSize) throw new Error('invalid size not found');

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
        const order = orders[0];
        const containerMenuItem = varContainerItems[0];
        if (!containerMenuItem.variableMaxAmount) throw new Error('container menu item does not have variableMaxAmount');
        const containerSize = containerMenuItem.sizes[0];
        const lines = linesFor(containerMenuItem.id, containerSize.id);

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerSize.id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount - 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
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
        const order = orders[0];
        const containerMenuItem = varContainerItems[0];
        if (!containerMenuItem.variableMaxAmount) throw new Error('container menu item does not have variableMaxAmount');
        const containerSize = containerMenuItem.sizes[0];
        const lines = linesFor(containerMenuItem.id, containerSize.id);

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerSize.id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
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
        const order = orders[0];
        const containerMenuItem = fixedContainerItems[0];
        const containerSize = containerMenuItem.sizes[0];
        const lines = linesFor(containerMenuItem.id, containerSize.id);
        const containedItem = lines[0].containedMenuItem;
        const containedItemSize = lines[0].containedItemSize;
        const invalidSize = containedItem.sizes.find((s) => s.id !== containedItemSize.id);
        if (!invalidSize) throw new Error('invalid size not found');

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerSize.id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
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
        const order = orders[0];
        const containerMenuItem = fixedContainerItems[1];
        const containerSize = containerMenuItem.sizes[0];
        const lines = linesFor(containerMenuItem.id, containerSize.id);

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerSize.id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: 0,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
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
        const order = orders[0];
        const containerMenuItem = varContainerItems[1];
        if (!containerMenuItem.variableMaxAmount) throw new Error('container menu item does not have variableMaxAmount');
        const containerSize = containerMenuItem.sizes[0];
        const lines = linesFor(containerMenuItem.id, containerSize.id);

        const dto: CreateOrderMenuItemDto = plainToInstance(CreateOrderMenuItemDto, {
            menuItemId: containerMenuItem.id,
            sizeId: containerSize.id,
            quantity: 1,
            parentOrderId: order.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: containerMenuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: containerMenuItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
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
        const orderMenuItemToUpdate = orderMenuItems[0];
        const newContainerItem = varContainerItems[0];
        if (!newContainerItem.variableMaxAmount) throw new Error('container item does not have variableMaxAmount');
        const containerSize = newContainerItem.sizes[0];
        const lines = linesFor(newContainerItem.id, containerSize.id);

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            quantity: 5,
            menuItemId: newContainerItem.id,
            sizeId: containerSize.id,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: newContainerItem.variableMaxAmount - 1,
                    parentMenuItemIdCtx: newContainerItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: lines[1].containedMenuItem.id,
                    containedItemSizeId: lines[1].containedItemSize.id,
                    quantity: 1,
                    parentMenuItemIdCtx: newContainerItem.id,
                    parentMenuItemSizeIdCtx: containerSize.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, orderMenuItemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: invalid size', async () => {
        const orderMenuItemToUpdate = orderMenuItems[0];
        const menuItem = singleItems.find((mi) => mi.id === orderMenuItemToUpdate.menuItem.id);
        if (!menuItem) throw new Error('menu item not found');

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !menuItem.sizes?.some((ms) => ms.id === s.id),
        );
        if (!invalidSize) throw new Error('invalid size not found');

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            sizeId: invalidSize.id,
            menuItemId: orderMenuItemToUpdate.menuItem.id,
            quantity: orderMenuItemToUpdate.quantity,
            containerOrderMenuItems: [],
        });

        const errors = await validator.validateDto(dto, orderMenuItemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['size']));
    });

    it('fail validate update: duplicate container item', async () => {
        const containerOrderMenuItem = containerOrderMenuItems[0];
        const menuItem = containerOrderMenuItem.menuItem;
        const size = containerOrderMenuItem.size!;
        const lines = linesFor(menuItem.id, size.id);

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: menuItem.id,
            sizeId: size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: menuItem.id,
                    parentMenuItemSizeIdCtx: size.id,
                }),
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: 3,
                    parentMenuItemIdCtx: menuItem.id,
                    parentMenuItemSizeIdCtx: size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerOrderMenuItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: container quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await orderMenuItemRepo.findOneOrFail({
            where: { id: containerOrderMenuItems[1].id },
            relations: ['menuItem', 'size'],
        });
        const menuItem = containerOrderMenuItem.menuItem;
        if (!menuItem.variableMaxAmount) throw new Error('container menu item does not have variableMaxAmount');
        const size = containerOrderMenuItem.size!;
        const lines = linesFor(menuItem.id, size.id);

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: menuItem.id,
            sizeId: size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: menuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: menuItem.id,
                    parentMenuItemSizeIdCtx: size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerOrderMenuItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {
        const containerOrderMenuItem = containerOrderMenuItems[0];
        const menuItem = containerOrderMenuItem.menuItem;
        const size = containerOrderMenuItem.size!;
        const lines = linesFor(menuItem.id, size.id);
        const containedItem = lines[0].containedMenuItem;
        const containedItemSize = lines[0].containedItemSize;
        const invalidSize = containedItem.sizes.find((s) => s.id !== containedItemSize.id);
        if (!invalidSize) throw new Error('invalid size not found');

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: menuItem.id,
            sizeId: size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentMenuItemIdCtx: menuItem.id,
                    parentMenuItemSizeIdCtx: size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerOrderMenuItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {
        const containerOrderMenuItem = containerOrderMenuItems[0];
        const menuItem = containerOrderMenuItem.menuItem;
        const size = containerOrderMenuItem.size!;
        const existingLine = containerOrderMenuItem.containerOrderMenuItems![0];
        const lines = linesFor(menuItem.id, size.id);

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: menuItem.id,
            sizeId: size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedUpdateOrderContainerItemDto, {
                    id: existingLine.id,
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: 0,
                    parentMenuItemIdCtx: menuItem.id,
                    parentMenuItemSizeIdCtx: size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerOrderMenuItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerOrderMenuItems', id: existingLine.id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: nested containerOrderMenuItems validator errors: parent with variable max amount and container quantity not equal to variable max amount', async () => {
        const containerOrderMenuItem = await orderMenuItemRepo.findOneOrFail({
            where: { id: containerOrderMenuItems[1].id },
            relations: ['menuItem', 'size'],
        });
        const menuItem = containerOrderMenuItem.menuItem;
        if (!menuItem.variableMaxAmount) throw new Error('container menu item does not have variableMaxAmount');
        const size = containerOrderMenuItem.size!;
        const lines = linesFor(menuItem.id, size.id);

        const dto: UpdateOrderMenuItemDto = plainToInstance(UpdateOrderMenuItemDto, {
            menuItemId: menuItem.id,
            sizeId: size.id,
            quantity: containerOrderMenuItem.quantity,
            containerOrderMenuItems: [
                plainToInstance(NestedUpdateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: lines[0].containedMenuItem.id,
                    containedItemSizeId: lines[0].containedItemSize.id,
                    quantity: menuItem.variableMaxAmount + 1,
                    parentMenuItemIdCtx: menuItem.id,
                    parentMenuItemSizeIdCtx: size.id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, containerOrderMenuItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });
});
