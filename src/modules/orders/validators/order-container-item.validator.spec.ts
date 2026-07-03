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
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemValidator } from './order-container-item.validator';

const P = `t${Date.now()}`;

describe('order container item validator', () => {
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: OrderContainerItemValidator;
    let orderContainerItemRepo: Repository<OrderContainerItem>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemCategoryRepo: Repository<MenuItemCategory>;
    let menuItemSizeRepo: Repository<MenuItemSize>;

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

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);

        validator = module.get<OrderContainerItemValidator>(OrderContainerItemValidator);

        orderContainerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ categories, orders, singleItems, fixedContainerItems, varContainerItems, containerLines, orderMenuItems, containerOrderMenuItems, menuItemCategories, menuItemSizes } =
            await testingUtil.seedOrderMenuItems(P));
    });

    afterAll(async () => {
        await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
        await orderRepo.delete(orders.map((o) => o.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await menuItemContainerItemRepo.delete(containerLines.map((l) => l.id));
        await menuItemRepo.delete([...singleItems, ...fixedContainerItems, ...varContainerItems].map((i) => i.id));
        await menuItemSizeRepo.delete(menuItemSizes.map((s) => s.id));
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
        const parentOrderMenuItem = containerOrderMenuItems[0];
        const existingLine = parentOrderMenuItem.containerOrderMenuItems![0];

        const dto: CreateOrderContainerItemDto = plainToInstance(CreateOrderContainerItemDto, {
            containedMenuItemId: existingLine.containedMenuItem.id,
            containedItemSizeId: existingLine.containedItemSize.id,
            quantity: 2,
            parentOrderMenuItemId: parentOrderMenuItem.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: contained item not of type single', async () => {
        const parentOrderMenuItem = containerOrderMenuItems[1];
        const containerItem = fixedContainerItems[0];

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

    it('fail validate create: quantity with value 0', async () => {
        const parentOrderMenuItem = containerOrderMenuItems[0];
        const existingLine = parentOrderMenuItem.containerOrderMenuItems![0];

        const dto: CreateOrderContainerItemDto = plainToInstance(CreateOrderContainerItemDto, {
            containedMenuItemId: existingLine.containedMenuItem.id,
            containedItemSizeId: existingLine.containedItemSize.id,
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
        const containerItemToUpdate = containerOrderMenuItems[0].containerOrderMenuItems![0];
        const otherLine = containerOrderMenuItems[0].containerOrderMenuItems!.find(
            (l) => l.id !== containerItemToUpdate.id,
        );
        if (!otherLine) throw new Error('other line not found');

        const dto: UpdateOrderContainerItemDto = plainToInstance(UpdateOrderContainerItemDto, {
            containedMenuItemId: otherLine.containedMenuItem.id,
            containedItemSizeId: otherLine.containedItemSize.id,
            quantity: containerItemToUpdate.quantity,
        });

        const errors = await validator.validateDto(dto, containerItemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: contained item not of type single', async () => {
        const containerItemToUpdate = containerOrderMenuItems[0].containerOrderMenuItems![0];
        const containerItem = fixedContainerItems[1];

        const dto: UpdateOrderContainerItemDto = plainToInstance(UpdateOrderContainerItemDto, {
            containedMenuItemId: containerItem.id,
            containedItemSizeId: containerItem.sizes[0].id,
            quantity: 2,
        });

        const errors = await validator.validateDto(dto, containerItemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']),
        );
    });

    it('fail validate update: quantity with value 0', async () => {
        const containerItemToUpdate = containerOrderMenuItems[1].containerOrderMenuItems![0];

        const dto: UpdateOrderContainerItemDto = plainToInstance(UpdateOrderContainerItemDto, {
            quantity: 0,
            containedMenuItemId: containerItemToUpdate.containedMenuItem.id,
            containedItemSizeId: containerItemToUpdate.containedItemSize.id,
        });

        const errors = await validator.validateDto(dto, containerItemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });
});
