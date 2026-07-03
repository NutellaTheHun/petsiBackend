import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { orderToUpdateDto } from '../utils/entity-transformers/order.dto.transformer';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderController } from './order.controller';

const P = `t${Date.now()}`;

describe('order revision history (controller)', () => {
    let module: TestingModule;
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

    const createdOrderIds: number[] = [];

    beforeAll(async () => {
        module = await getOrdersTestingModule({ mockRevisionHistory: false });
        const testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);

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
        await orderRepo.delete(createdOrderIds);
        await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
        await orderRepo.delete(orders.map((o) => o.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await menuItemContainerItemRepo.delete(containerLines.map((l) => l.id));
        await menuItemRepo.delete([...singleItems, ...fixedContainerItems, ...varContainerItems].map((i) => i.id));
        await menuItemSizeRepo.delete(menuItemSizes.map((s) => s.id));
        await menuItemCategoryRepo.delete(menuItemCategories.map((c) => c.id));
        await module.close();
    });

    it('creates revisions on create/update and records revert', async () => {
        const rhs = module.get(RevisionHistoryService);
        const cat = categories[0];
        const mi = singleItems[0];

        const dto = plainToInstance(CreateOrderDto, {
            recipient: `${P}-revision-history-order`,
            fulfillmentDate: new Date('2026-02-01'),
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
        });

        const created = await controller.createOrderResponse(dto);
        createdOrderIds.push(created.id);
        const afterCreate = await rhs.listRevisions('order', created.id);
        expect(afterCreate.length).toBeGreaterThanOrEqual(1);
        expect(afterCreate[0].revisionNumber).toEqual(1);
        expect(afterCreate[0].changeLog.kind).toEqual('created');

        const row = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: [
                'recurrenceSchedule',
                'orderedItems',
                'orderedItems.menuItem',
                'orderedItems.size',
                'category',
                'orderedItems.containerOrderMenuItems',
                'orderedItems.containerOrderMenuItems.containedMenuItem',
                'orderedItems.containerOrderMenuItems.containedItemSize',
            ],
        });
        const updateDto = orderToUpdateDto(row, { recipient: `${P}-revision-history-order-v2` });
        await controller.updateOrderResponse(created.id, updateDto);

        const afterUpdate = await rhs.listRevisions('order', created.id);
        expect(afterUpdate.length).toBeGreaterThanOrEqual(2);
        expect(afterUpdate[0].revisionNumber).toEqual(2);
        expect(afterUpdate[0].changeLog.kind).toEqual('updated');

        const reverted = await controller.revertOrder(created.id, 1);
        expect(reverted.recipient).toEqual(`${P}-revision-history-order`);

        const afterRevert = await rhs.listRevisions('order', created.id);
        expect(afterRevert[0].revisionNumber).toEqual(3);
        expect(afterRevert[0].changeLog.kind).toEqual('reverted');
    });

    it('serves changeLog and payload in detail endpoint', async () => {
        const rhs = module.get(RevisionHistoryService);
        const cat = categories[1];
        const mi = singleItems[1];

        const created = await controller.createOrderResponse(
            plainToInstance(CreateOrderDto, {
                recipient: `${P}-revision-detail-order`,
                fulfillmentDate: new Date('2026-02-01'),
                fulfillmentType: 'pickup',
                categoryId: cat.id,
                orderedItems: [
                    plainToInstance(NestedCreateOrderMenuItemDto, {
                        createId: 'o1',
                        menuItemId: mi.id,
                        sizeId: mi.sizes[0].id,
                        quantity: 1,
                    }),
                ],
            }),
        );
        createdOrderIds.push(created.id);

        const revisions = await rhs.listRevisions('order', created.id);
        expect(revisions.length).toBeGreaterThanOrEqual(1);

        const rev = await rhs.getRevisionOrThrow(
            'order',
            created.id,
            revisions[0].revisionNumber,
        );
        expect(rev.revisionNumber).toEqual(revisions[0].revisionNumber);
        expect(rev.changeLog).toBeDefined();
        expect(rev.payload).toBeDefined();
    });
});

