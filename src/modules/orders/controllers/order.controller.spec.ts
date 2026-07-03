import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderController } from './order.controller';

const P = `t${Date.now()}`;

describe('order controller', () => {
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: OrderController;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
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
    let menuItemCategories: MenuItemCategory[];
    let menuItemSizes: MenuItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);

        controller = module.get<OrderController>(OrderController);
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ categories, orders, singleItems, fixedContainerItems, varContainerItems, containerLines, orderMenuItems, menuItemCategories, menuItemSizes } =
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

    it('createOrderResponse throws ValidationException for invalid fulfillmentType', async () => {
        const category = categories[0];
        const singleMenuItem = singleItems[0];

        const dto = plainToInstance(CreateOrderDto, {
            recipient: `${P}-invalid-fulfillment-type`,
            fulfillmentDate: new Date(),
            fulfillmentType: 'invalid_type',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: singleMenuItem.id,
                    sizeId: singleMenuItem.sizes[0].id,
                    quantity: 2,
                }),
            ],
        });
        try {
            await controller.createOrderResponse(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
                    'fulfillmentType',
                ]),
            );
        }
    });

    it('updateOrderResponse surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateOrderDto, {
            recipient: 'DoesNotMatter',
        });
        await expect(
            controller.updateOrderResponse(9_999_999, dto),
        ).rejects.toThrow(DatabaseException);
    });

    it('remove deletes a created order then findOne fails', async () => {
        const category = categories[0];
        const menuItem = singleItems[0];

        const created = await controller.createOrderResponse(
            plainToInstance(CreateOrderDto, {
                recipient: `${P}-controller-remove`,
                fulfillmentDate: new Date('2026-03-01'),
                fulfillmentType: 'pickup',
                categoryId: category.id,
                orderedItems: [
                    plainToInstance(NestedCreateOrderMenuItemDto, {
                        createId: 'rm1',
                        menuItemId: menuItem.id,
                        sizeId: menuItem.sizes[0].id,
                        quantity: 1,
                    }),
                ],
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOneOrderResponse(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
