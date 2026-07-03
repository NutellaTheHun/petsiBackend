import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Between, DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { RecurringOrderSchedule } from '../entities/recurring-order-schedule.entity';
import { orderToUpdateDto } from '../utils/entity-transformers/order.dto.transformer';
import { recurringOrderScheduleToNestedUpdateDto, recurringOrderScheduleToUpdateDto } from '../utils/entity-transformers/recurring-order-schedule.dto.transformer';
import { OCCURRENCE_STATES, OCCURRENCE_TYPES } from '../utils/occurence-types';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderService } from './order.service';

class TestableOrderService extends OrderService {
    async createEntityForTest(
        dto: CreateOrderDto,
        manager: EntityManager,
    ): Promise<Order> {
        const entity = await this.createEntity(dto, manager);
        await this.afterCreateInTransaction(manager, entity);
        return entity;
    }
    async updateEntityForTest(
        dto: UpdateOrderDto,
        entity: Order,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('order service', () => {
    let orderService: TestableOrderService;
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemCategoryRepo: Repository<MenuItemCategory>;
    let menuItemSizeRepo: Repository<MenuItemSize>;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    let categories: OrderCategory[];
    let orders: Order[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let containerLines: MenuItemContainerItem[];
    let orderMenuItems: OrderMenuItem[];
    let recurringOrder: Order;
    let menuItemCategories: MenuItemCategory[];
    let menuItemSizes: MenuItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule({
            orderServiceClass: TestableOrderService,
        });

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dataSource = module.get(DataSource);

        orderService = module.get(OrderService) as TestableOrderService;
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));

        ({ categories, orders, singleItems, fixedContainerItems, varContainerItems, containerLines, orderMenuItems, recurringOrder, menuItemCategories, menuItemSizes } =
            await testingUtil.seedRecurringOrder(P));
    });

    afterAll(async () => {
        await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
        await orderRepo.delete([...orders, recurringOrder].map((o) => o.id));
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

    // test createEntity() with NestedCreateOrderMenuItemDto
    it('should create order with NestedCreateOrderMenuItemDto', async () => {
        const category = categories[0];
        const menuItem = singleItems[0];

        const dto = plainToInstance(CreateOrderDto, {
            recipient: `${P}-created-recipient`,
            fulfillmentDate: new Date('2026-02-01'),
            fulfillmentType: 'pickup',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: menuItem.id,
                    sizeId: menuItem.sizes[0].id,
                    quantity: 2,
                }),
            ],
        });

        await dataSource.transaction(async (manager) => {
            const result = await orderService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.recipient).toEqual(dto.recipient);
            expect(result.orderedItems).toBeDefined();
            expect(Array.isArray(result.orderedItems)).toBe(true);
            testCtx.addCleanupFunction(async () => {
                await orderRepo.delete(result.id);
            });
        });
    });

    // test createEntity() with NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos
    it('should create order with NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos', async () => {
        const category = categories[0];
        const container = fixedContainerItems[0];
        const line = containerLines.find((l) => l.parentMenuItem.id === container.id);
        if (!line) throw new Error('container line not found');

        const dto = plainToInstance(CreateOrderDto, {
            recipient: `${P}-container-recipient`,
            fulfillmentDate: new Date('2026-02-02'),
            fulfillmentType: 'delivery',
            deliveryAddress: `${P}-address`,
            phoneNumber: `${P}-phone`,
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o2',
                    menuItemId: container.id,
                    sizeId: line.parentItemSize.id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c1',
                            containedMenuItemId: line.containedMenuItem.id,
                            containedItemSizeId: line.containedItemSize.id,
                            quantity: 4,
                        }),
                    ],
                }),
            ],
        });

        await dataSource.transaction(async (manager) => {
            const result = await orderService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            const oi = result.orderedItems?.[0];
            expect(oi?.containerOrderMenuItems).toBeDefined();
            expect(Array.isArray(oi?.containerOrderMenuItems)).toBe(true);
            expect(oi?.containerOrderMenuItems?.length ?? 0).toBeGreaterThan(0);
            testCtx.addCleanupFunction(async () => {
                await orderRepo.delete(result.id);
            });
        });
    });

    // test updateEntity()
    it('should update order', async () => {
        const newRecipient = `${P}-updated-recipient`;
        const toUpdate = await orderRepo.findOneOrFail({
            where: { id: orders[0].id },
            relations: ['orderedItems', 'category', 'orderedItems.menuItem', 'orderedItems.containerOrderMenuItems', 'orderedItems.containerOrderMenuItems.containedMenuItem', 'orderedItems.containerOrderMenuItems.containedItemSize'],
        });

        const dto = orderToUpdateDto(toUpdate, { recipient: newRecipient });

        await dataSource.transaction(async (manager) => {
            await orderService.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await orderRepo.findOneOrFail({ where: { id: toUpdate.id } });
        expect(result.recipient).toEqual(newRecipient);
    });

    // test updateEntity() with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto
    it('should update order with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto', async () => {
        const order = await orderRepo.findOneOrFail({
            where: { id: orders[1].id },
            relations: ['orderedItems', 'orderedItems.menuItem', 'orderedItems.size', 'orderedItems.containerOrderMenuItems', 'orderedItems.containerOrderMenuItems.containedMenuItem', 'orderedItems.containerOrderMenuItems.containedItemSize'],
        });

        const menuItem = singleItems[2];

        const dto = orderToUpdateDto(order, {
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: menuItem.id,
                    sizeId: menuItem.sizes[0].id,
                    quantity: 1,
                }),
            ],
        });

        const lineList = [...(dto.orderedItems ?? [])];
        const itemToUpdate = lineList.pop();
        if (!itemToUpdate) throw new Error('item to update not found');
        if ('createId' in itemToUpdate) {
            throw new Error('must have id for new update order');
        }

        const newQuantity = 100;
        const newItemUpdate = plainToInstance(NestedUpdateOrderMenuItemDto, {
            id: itemToUpdate.id,
            menuItemId: itemToUpdate.menuItemId,
            sizeId: itemToUpdate.sizeId,
            quantity: newQuantity,
        });

        lineList.push(newItemUpdate);

        await dataSource.transaction(async (manager) => {
            await orderService.updateEntityForTest(
                { ...dto, orderedItems: lineList },
                order,
                manager,
            );
        });

        const reloaded = await orderRepo.findOneOrFail({
            where: { id: order.id },
            relations: ['orderedItems'],
        });
        expect(reloaded.orderedItems!.length).toBeGreaterThanOrEqual(2);
        const updated = reloaded.orderedItems!.find((x) => x.id === itemToUpdate.id);
        expect(updated?.quantity).toEqual(newQuantity);
    });

    it('promotes OCCURRENCE GENERATED to MODIFIED on update', async () => {
        const category = categories[0];
        const menuItem = singleItems[0];

        const fulfillmentDate = new Date();
        fulfillmentDate.setHours(12, 0, 0, 0);
        const daysOfWeek = [fulfillmentDate.getDay()];
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate: fulfillmentDate,
        });

        const createDto = plainToInstance(CreateOrderDto, {
            recipient: `${P}-promote-gen-test`,
            fulfillmentDate,
            fulfillmentType: 'pickup',
            categoryId: category.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: menuItem.id,
                    sizeId: menuItem.sizes[0].id,
                    quantity: 1,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });

        const created = await orderService.createEntityForTest(createDto, dataSource.manager);
        testCtx.addCleanupFunction(async () => {
            await orderRepo.delete({ templateOrderId: created.id } as any);
            await orderRepo.delete(created.id);
        });

        const occ = await orderRepo.findOneOrFail({
            where: {
                templateOrderId: created.id,
                occurrenceType: OCCURRENCE_TYPES.OCCURRENCE,
                occurrenceState: OCCURRENCE_STATES.GENERATED,
            },
        });

        const occReloaded = await orderRepo.findOneOrFail({
            where: { id: occ.id },
            relations: [
                'orderedItems',
                'orderedItems.menuItem',
                'orderedItems.size',
                'orderedItems.containerOrderMenuItems',
                'orderedItems.containerOrderMenuItems.containedMenuItem',
                'orderedItems.containerOrderMenuItems.containedItemSize',
                'category',
                'recurrenceSchedule',
            ],
        });

        const updateDto = plainToInstance(UpdateOrderDto, {
            note: 'edited by occurrence test',
        });

        await dataSource.transaction(async (manager) => {
            await orderService.updateEntityForTest(updateDto, occReloaded, manager);
        });

        const result = await orderRepo.findOneOrFail({ where: { id: occ.id } });
        expect(result.occurrenceState).toEqual(OCCURRENCE_STATES.MODIFIED);
        expect(result.note).toEqual('edited by occurrence test');
    });

    // test findAll()
    it('should find seeded order in findAll search by recipient', async () => {
        const serviceResult = await orderService.findAll({
            search: orders[3].recipient,
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((o) => o.id === orders[3].id);
        expect(found).toBeDefined();
        expect(
            serviceResult?.items.every((o) =>
                o.recipient.toLowerCase().includes(orders[3].recipient.toLowerCase()),
            ),
        ).toBe(true);
    });

    // test findAll() with search by menuItem name
    it('should find seeded order in findAll search by menuItem name', async () => {
        const oi = orderMenuItems.find((i) => i.menuItem.name === singleItems[0].name);
        if (!oi) throw new Error('order line with menu item name required');
        const needle = oi.menuItem.name;

        const serviceResult = await orderService.findAll({
            search: needle,
            limit: 100,
            relations: [
                'orderedItems',
                'orderedItems.menuItem',
                'orderedItems.containerOrderMenuItems',
                'orderedItems.containerOrderMenuItems.containedMenuItem',
                'orderedItems.containerOrderMenuItems.containedItemSize',
            ],
        });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((o) => o.id === oi.parentOrder.id);
        expect(found).toBeDefined();
        expect(
            serviceResult?.items.every(
                (o) =>
                    o.recipient.toLowerCase().includes(needle.toLowerCase()) ||
                    o.orderedItems?.some((line) =>
                        line.menuItem?.name?.toLowerCase().includes(needle.toLowerCase()),
                    ),
            ),
        ).toBe(true);
    });

    // test findAll() with filter by category
    it('should find seeded orders in findAll filtered by category', async () => {
        const category = categories[0];
        const serviceResult = await orderService.findAll({
            filters: [`category=${category.id}`],
            relations: ['category'],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((o) => o.category?.id === category.id);
        expect(found).toBeDefined();
        expect(serviceResult?.items.every((o) => o.category?.id === category.id)).toBe(true);
    });

    // test findAll() with filter by isFrozen
    it('should find all orders with filter by isFrozen', async () => {
        const serviceResult = await orderService.findAll({
            filters: ['isFrozen=false'],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((o) => o.id === orders[0].id);
        expect(found).toBeDefined();
        expect(serviceResult?.items.every((o) => !o.isFrozen)).toBe(true);
    });

    // test findAll() with filter by fulfillmentType
    it('should find seeded order in findAll filtered by fulfillmentType', async () => {
        const target = orders.find((o) => o.fulfillmentType === 'pickup');
        if (!target) throw new Error('no pickup order seeded');

        const serviceResult = await orderService.findAll({
            filters: ['fulfillmentType=pickup'],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((o) => o.id === target.id);
        expect(found).toBeDefined();
        expect(serviceResult?.items.every((o) => o.fulfillmentType === 'pickup')).toBe(true);
    });

    // test findAll() by applyDate with startDate and endDate
    it('should find seeded orders in findAll by applyDate with startDate and endDate', async () => {
        const dates = orders.map((o) => o.fulfillmentDate.getTime());
        const sDate = new Date(Math.min(...dates) - 1000 * 60 * 60 * 24);
        const eDate = new Date(Math.max(...dates) + 1000 * 60 * 60 * 24);

        const serviceResult = await orderService.findAll({
            startDate: sDate.toISOString(),
            endDate: eDate.toISOString(),
            dateBy: 'fulfillmentDate',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((o) => o.id === orders[0].id);
        expect(found).toBeDefined();
        expect(
            serviceResult?.items.every(
                (o) => o.fulfillmentDate >= sDate && o.fulfillmentDate <= eDate,
            ),
        ).toBe(true);
    });

    // test findOne()
    it('should find one order with relations', async () => {
        const serviceResult = await orderService.findOne(orders[0].id, [
            'category',
            'orderedItems',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(orders[0].id);
        expect(serviceResult?.category).toBeDefined();
        expect(Array.isArray(serviceResult?.orderedItems)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(orderService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    //  --- Test recurring order schedule via order service ---
    it('should create a recurring order schedule', async () => {
        const ros_dto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek: [1],
            startDate: new Date(),
        });

        const menuItem = singleItems[0];
        const category = categories[0];

        const orderDto = plainToInstance(CreateOrderDto, {
            recipient: `${P}-ros-create-recipient`,
            fulfillmentDate: new Date(new Date().setDate(new Date().getDate() + 3)),
            fulfillmentType: 'pickup',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: menuItem.id,
                    sizeId: menuItem.sizes[0].id,
                    quantity: 1,
                }),
            ],
            recurrenceSchedule: ros_dto,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
        });

        await dataSource.transaction(async (manager) => {
            const result = await orderService.createEntityForTest(orderDto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.recurrenceSchedule?.id).toBeDefined();
            const occCount = await manager.count(Order, {
                where: {
                    templateOrderId: result.id,
                    occurrenceType: OCCURRENCE_TYPES.OCCURRENCE,
                    occurrenceState: OCCURRENCE_STATES.GENERATED,
                },
            });
            expect(occCount).toBeGreaterThan(0);
            testCtx.addCleanupFunction(async () => {
                await orderRepo.delete({ templateOrderId: result.id } as any);
                await orderRepo.delete(result.id);
            });
        });
    });

    describe('recurring order schedule lifecycle', () => {
        it('should update a recurring order schedule', async () => {
            const order = await orderRepo.findOneOrFail({
                where: { id: recurringOrder.id },
                relations: ['recurrenceSchedule', 'category', 'orderedItems', 'orderedItems.menuItem', 'orderedItems.size'],
            });
            if (!order.recurrenceSchedule) throw new Error('order with recurrence schedule not found');

            const ros_dto = recurringOrderScheduleToNestedUpdateDto(order.recurrenceSchedule, {
                frequency: 'MONTHLY',
                interval: 2,
                daysOfWeek: [2],
            });

            const orderDto = orderToUpdateDto(order, { recurrenceSchedule: ros_dto });

            await dataSource.transaction(async (manager) => {
                await orderService.updateEntityForTest(orderDto, order, manager);
            });

            const reloaded = await orderRepo.findOneOrFail({ where: { id: order.id }, relations: ['recurrenceSchedule'] });
            if (!reloaded.recurrenceSchedule) throw new Error('recurrence schedule not found');
            const reloated_ros_dto = recurringOrderScheduleToUpdateDto(reloaded.recurrenceSchedule);
            expect(reloated_ros_dto.frequency).toEqual('MONTHLY');
            expect(reloated_ros_dto.interval).toEqual(2);
            expect(reloated_ros_dto.daysOfWeek).toEqual([2]);
        });

        it('should delete a recurring order schedule', async () => {
            const order = await orderRepo.findOneOrFail({
                where: { id: recurringOrder.id },
                relations: ['recurrenceSchedule', 'category', 'orderedItems', 'orderedItems.menuItem', 'orderedItems.size'],
            });
            if (!order.recurrenceSchedule) throw new Error('order with recurrence schedule not found');

            const savedRecurrenceId = order.recurrenceSchedule.id;

            const orderDto = orderToUpdateDto(order, { recurrenceSchedule: null });

            await dataSource.transaction(async (manager) => {
                await orderService.updateEntityForTest(orderDto, order, manager);
            });

            const result = await recurringOrderScheduleRepo.findOne({ where: { id: savedRecurrenceId } });
            expect(result).toBeNull();
            expect(order.recurrenceSchedule).toBeNull();
            expect(order.occurrenceType).toBeNull();
        });

        it('should delete an order and also delete the recurring order schedule', async () => {
            const ros_dto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
                createId: 'r1',
                frequency: 'WEEKLY',
                interval: 1,
                daysOfWeek: [1],
                startDate: new Date(),
            });
            const createDto = plainToInstance(CreateOrderDto, {
                recipient: `${P}-cascade-delete-recipient`,
                fulfillmentDate: new Date(new Date().setDate(new Date().getDate() + 3)),
                fulfillmentType: 'pickup',
                categoryId: categories[0].id,
                orderedItems: [
                    plainToInstance(NestedCreateOrderMenuItemDto, {
                        createId: 'c1',
                        menuItemId: singleItems[0].id,
                        sizeId: singleItems[0].sizes[0].id,
                        quantity: 1,
                    }),
                ],
                recurrenceSchedule: ros_dto,
                occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            });

            const created = await orderService.createEntityForTest(createDto, dataSource.manager);
            const order = await orderRepo.findOneOrFail({
                where: { id: created.id },
                relations: ['recurrenceSchedule'],
            });
            if (!order.recurrenceSchedule) throw new Error('order with recurrence schedule not found');
            const savedRecurrenceId = order.recurrenceSchedule.id;

            testCtx.addCleanupFunction(async () => {
                await orderRepo.delete({ templateOrderId: created.id } as any);
                await orderRepo.delete(created.id);
            });

            const removal = await orderService.remove(order.id);
            expect(removal).toBe(true);
            const result = await recurringOrderScheduleRepo.findOne({ where: { id: savedRecurrenceId } });
            expect(result).toBeNull();
        });
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(OrderService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches current order', async () => {
            const order = await orderRepo.findOneOrFail({
                where: { id: orders[2].id },
                relations: ['orderedItems', 'orderedItems.menuItem', 'orderedItems.size', 'category', 'orderedItems.containerOrderMenuItems', 'orderedItems.containerOrderMenuItems.containedMenuItem', 'orderedItems.containerOrderMenuItems.containedItemSize'],
            });
            const dto = orderToUpdateDto(order, {
                fulfillmentContactName: order.fulfillmentContactName,
            });
            const result = await orderService.update(order.id, dto);
            expect(result.recipient).toEqual(order.recipient);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when recipient changes', async () => {
            const order = await orderRepo.findOneOrFail({
                where: { id: orders[2].id },
                relations: ['orderedItems', 'orderedItems.menuItem', 'orderedItems.size', 'category', 'orderedItems.containerOrderMenuItems', 'orderedItems.containerOrderMenuItems.containedMenuItem', 'orderedItems.containerOrderMenuItems.containedItemSize'],
            });
            const newRecipient = `${order.recipient}-renamed`;
            const dto = orderToUpdateDto(order, { recipient: newRecipient });
            const result = await orderService.update(order.id, dto);
            expect(result.recipient).toEqual(newRecipient);
            expect(spy).toHaveBeenCalled();
            const row = await orderRepo.findOneOrFail({ where: { id: order.id } });
            expect(row.recipient).toEqual(newRecipient);
        });
    });

    describe('order lifecycle', () => {
        let order: Order;

        it('should create', async () => {
            const dto = plainToInstance(CreateOrderDto, {
                recipient: `${P}-lifecycle-recipient`,
                fulfillmentDate: new Date('2026-03-01'),
                fulfillmentType: 'pickup',
                categoryId: categories[0].id,
                orderedItems: [
                    plainToInstance(NestedCreateOrderMenuItemDto, {
                        createId: 'o1',
                        menuItemId: singleItems[0].id,
                        sizeId: singleItems[0].sizes[0].id,
                        quantity: 1,
                    }),
                ],
            });
            await dataSource.transaction(async (manager) => {
                order = await orderService.createEntityForTest(dto, manager);
            });
            expect(order.id).toBeDefined();
        });

        it('should remove', async () => {
            const deleteResult = await orderService.remove(order.id);
            expect(deleteResult).toBe(true);
            await expect(orderService.findOne(order.id)).rejects.toThrow(NotFoundException);
        });
    });
});
