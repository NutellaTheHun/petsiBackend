import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { rrulestr } from 'rrule';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { Order } from '../entities/order.entity';
import { OCCURRENCE_STATES, OCCURRENCE_TYPES } from '../utils/occurence-types';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderRecurrenceService } from './order-recurrence.service';
import { OrderService } from './order.service';

class TestableOrderService extends OrderService {
    async createEntityForTest(dto: CreateOrderDto, manager: EntityManager): Promise<Order> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(dto: UpdateOrderDto, entity: Order, manager: EntityManager): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

class TestableOrderRecurrenceService extends OrderRecurrenceService {
    async generateRecurringOrdersForTest(): Promise<void> {
        return this.generateRecurringOrders();
    }
    async handleTemplateOrderUpdateForTest(templateOrder: Order): Promise<void> {
        return this.handleTemplateOrderUpdate(templateOrder.id);
    }
    async handleTemplateFulfillmentDateForTest(templateOrder: Order): Promise<void> {
        return this.handleTemplateFulfillmentDate(templateOrder);
    }
    async cloneTemplateToOccurenceForTest(templateOrder: Order, occurenceDate: Date): Promise<Order> {
        return Promise.resolve(this.cloneTemplateToOccurence(templateOrder, occurenceDate));
    }
    async ensureGeneratedOrdersForTest(templateOrder: Order, horizonDate: Date): Promise<void> {
        return this.ensureGeneratedOrders(templateOrder, horizonDate);
    }
    async removeFutureGeneratedOrdersForTest(templateOrder: Order, startDate: Date): Promise<void> {
        return this.removeFutureGeneratedOrders(templateOrder, startDate);
    }
    nextOccurenceForTest(rrule: string, startDate: Date): Date {
        return this.nextOccurence(rrule, startDate);
    }
}

describe('OrderRecurrenceService', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    let recurrenceService: TestableOrderRecurrenceService;

    let orderRepo: Repository<Order>;
    let orderService: TestableOrderService;

    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;
    let containerItemRepo: Repository<MenuItemContainerItem>;

    beforeAll(async () => {
        jest.setTimeout(120000);
        const module: TestingModule = await getOrdersTestingModule({
            orderServiceClass: TestableOrderService,
            orderRecurrenceServiceClass: TestableOrderRecurrenceService,
        });
        dbTestContext = new DatabaseTestContext();
        dataSource = module.get(DataSource);

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        recurrenceService = module.get(OrderRecurrenceService);

        orderService = module.get(OrderService);

        orderRepo = module.get(getRepositoryToken(Order));

        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    }, 120000);

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    }, 120000);

    it('should be defined', () => {
        expect(recurrenceService).toBeDefined();
    });

    it('should return the next occurence date from rrule', () => {
        const rrule =
            'DTSTART:20120201T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20130130T230000Z;BYDAY=MO,FR';
        const startDate = new Date('2012-02-01');
        const expectedNextOccurence = new Date(Date.UTC(2012, 1, 3, 9, 30, 0));
        const nextOccurence = recurrenceService.nextOccurenceForTest(rrule, startDate);
        expect(nextOccurence).toEqual(expectedNextOccurence);
    });

    it('should return the next monthly occurence after startDate', () => {
        const rrule = 'DTSTART:20260101T120000Z\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15';
        const startDate = new Date(Date.UTC(2026, 0, 1));
        const next = recurrenceService.nextOccurenceForTest(rrule, startDate);
        expect(next.getUTCMonth()).toBe(0);
        expect(next.getUTCDate()).toBe(15);
    });

    it('should handle the template fulfillment date: weekly past fulfillment advances to next occurence', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const past = new Date();
        past.setDate(past.getDate() - 10);
        const daysOfWeek = [past.getDay()];

        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate: past,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: past,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const before = templateOrder.fulfillmentDate.getTime();
        const expected = recurrenceService.nextOccurenceForTest(
            templateOrder.recurrenceSchedule.rrule,
            startOfDayLocal(new Date()),
        );

        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);

        expect(templateOrder.fulfillmentDate.getTime()).not.toBe(before);
        expect(templateOrder.fulfillmentDate.getTime()).toBe(expected.getTime());
    });

    it('should handle the template fulfillment date: weekly future fulfillment unchanged', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const future = new Date();
        future.setDate(future.getDate() + 7);
        const daysOfWeek = [future.getDay()];

        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate: future,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: future,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const before = templateOrder.fulfillmentDate.getTime();
        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);
        expect(templateOrder.fulfillmentDate.getTime()).toBe(before);
    });

    it('should handle the template fulfillment date: monthly past fulfillment advances to next month', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 2);
        startDate.setDate(1);
        startDate.setHours(12, 0, 0, 0);

        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'MONTHLY',
            interval: 1,
            dayOfMonth: 1,
            startDate,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const expected = recurrenceService.nextOccurenceForTest(
            templateOrder.recurrenceSchedule.rrule,
            startOfDayLocal(new Date()),
        );
        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);

        expect(templateOrder.fulfillmentDate.getTime()).toBe(expected.getTime());
    });

    it('should handle the template fulfillment date: monthly future fulfillment unchanged', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1);
        startDate.setDate(28);

        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'MONTHLY',
            interval: 1,
            dayOfMonth: 28,
            startDate,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const before = templateOrder.fulfillmentDate.getTime();
        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);
        expect(templateOrder.fulfillmentDate.getTime()).toBe(before);
    });

    it('should clone the template order to the occurence date with new line item graphs', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const mi = await menuItemRepo.findOne({
            where: { type: MENU_ITEM_TYPES.CONTAINER },
            relations: ['sizes'],
        });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const menuItemSize = mi.sizes[0];
        const validContainerItems = await containerItemRepo.find({
            where: { parentItemSize: { id: menuItemSize.id }, parentMenuItem: { id: mi.id } },
            relations: ['containedMenuItem', 'containedItemSize'],
        });
        if (!validContainerItems?.length) throw new Error('valid container items not found');

        const containedItem = validContainerItems[0];

        const startDate = new Date(Date.UTC(2026, 5, 10, 12, 0, 0));
        const daysOfWeek = [startDate.getUTCDay()];

        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: menuItemSize.id,
                    quantity: 1,
                    containerItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'o2',
                            menuItemId: containedItem.containedMenuItem.id,
                            sizeId: containedItem.containedItemSize.id,
                            quantity: containedItem.quantity,
                            parentMenuItemIdCtx: mi.id,
                            parentMenuItemSizeIdCtx: menuItemSize.id,
                        }),
                    ],
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule', 'orderedItems', 'orderedItems.containerOrderMenuItems', 'category'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const occurenceDate = recurrenceService.nextOccurenceForTest(
            templateOrder.recurrenceSchedule.rrule,
            startDate,
        );
        const clonedOrder = await recurrenceService.cloneTemplateToOccurenceForTest(
            templateOrder,
            occurenceDate,
        );

        expect(clonedOrder.fulfillmentDate.getTime()).toEqual(occurenceDate.getTime());
        expect(clonedOrder.occurrenceType).toEqual(OCCURRENCE_TYPES.OCCURRENCE);
        expect(clonedOrder.occurrenceState).toEqual(OCCURRENCE_STATES.GENERATED);
        expect(clonedOrder.templateOrderId).toEqual(templateOrder.id);
        expect(clonedOrder.recurrenceSchedule).toBeNull();
        expect(clonedOrder.recurrenceDate?.getTime()).toEqual(occurenceDate.getTime());
        expect(clonedOrder.recipient).toEqual(templateOrder.recipient);
        expect(clonedOrder.fulfillmentType).toEqual(templateOrder.fulfillmentType);
        if (!clonedOrder.category || !templateOrder.category) throw new Error('category not found');
        expect(clonedOrder.category.id).toEqual(templateOrder.category.id);

        if (!clonedOrder.orderedItems || !templateOrder.orderedItems) throw new Error('ordered items not found');
        expect(clonedOrder.orderedItems.length).toEqual(templateOrder.orderedItems.length);
        expect(clonedOrder.orderedItems[0].id).not.toEqual(templateOrder.orderedItems[0].id);
        const c0 = clonedOrder.orderedItems[0].containerOrderMenuItems?.[0];
        const t0 = templateOrder.orderedItems[0].containerOrderMenuItems?.[0];
        if (c0 && t0) {
            expect(c0.id).not.toEqual(t0.id);
            expect(c0.quantity).toEqual(t0.quantity);
        }
    });

    it('should ensure generated orders for weekly template up to horizon', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const startDate = new Date();
        startDate.setHours(12, 0, 0, 0);
        const daysOfWeek = [startDate.getDay()];

        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule', 'orderedItems'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const horizonDate = new Date(startDate);
        horizonDate.setDate(horizonDate.getDate() + 45);

        const rrule = templateOrder.recurrenceSchedule.rrule;
        const rule = rrulestr(rrule);
        const anchor = templateOrder.recurrenceDate ?? templateOrder.fulfillmentDate;
        let expected = 0;
        let next: Date | null = rule.after(anchor, false);
        while (next && next.getTime() <= horizonDate.getTime()) {
            const skipTemplateSlot = sameCalendarDayLocal(next, templateOrder.fulfillmentDate);
            if (!skipTemplateSlot) {
                expected += 1;
            }
            next = rule.after(next, false);
        }

        await recurrenceService.ensureGeneratedOrdersForTest(templateOrder, horizonDate);

        const generatedOrders = await orderRepo.find({
            where: { templateOrderId: templateOrder.id, occurrenceState: OCCURRENCE_STATES.GENERATED },
        });
        expect(generatedOrders.length).toEqual(expected);
    });

    it('should remove future GENERATED occurences from startDate and keep MODIFIED', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const startDate = new Date();
        startDate.setHours(12, 0, 0, 0);
        const daysOfWeek = [startDate.getDay()];
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Remove future test',
            fulfillmentDate: startDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 1,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule', 'orderedItems'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const horizon = new Date(startDate);
        horizon.setDate(horizon.getDate() + 21);
        await recurrenceService.ensureGeneratedOrdersForTest(templateOrder, horizon);

        const all = await orderRepo.find({
            where: { templateOrderId: templateOrder.id, occurrenceType: OCCURRENCE_TYPES.OCCURRENCE },
        });
        expect(all.length).toBeGreaterThan(0);

        const future = all
            .filter((o) => o.recurrenceDate && o.recurrenceDate.getTime() >= startDate.getTime())
            .sort((a, b) => (a.recurrenceDate!.getTime() > b.recurrenceDate!.getTime() ? 1 : -1));
        const toModify = future[future.length - 1];
        await orderRepo.update(
            { id: toModify.id },
            { occurrenceState: OCCURRENCE_STATES.MODIFIED },
        );

        await recurrenceService.removeFutureGeneratedOrdersForTest(templateOrder, startDate);

        const remaining = await orderRepo.find({
            where: { templateOrderId: templateOrder.id },
        });
        const generated = remaining.filter((o) => o.occurrenceState === OCCURRENCE_STATES.GENERATED);
        const modified = remaining.find((o) => o.id === toModify.id);
        expect(generated.length).toEqual(0);
        expect(modified?.occurrenceState).toEqual(OCCURRENCE_STATES.MODIFIED);
    });

    it('should regenerate occurences after template update via order service', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

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

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Update regen test',
            fulfillmentDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
            recurrenceSchedule: recurrenceCreateDto,
        });
        const created = await orderService.createEntityForTest(dto, dataSource.manager);
        const templateOrder = await orderRepo.findOneOrFail({
            where: { id: created.id },
            relations: ['recurrenceSchedule', 'orderedItems'],
        });
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const horizon = new Date(fulfillmentDate);
        horizon.setDate(horizon.getDate() + 45);
        await recurrenceService.ensureGeneratedOrdersForTest(templateOrder, horizon);

        const menuItem = await menuItemRepo.findOneOrFail({ where: {}, relations: ['sizes'] });
        if (!menuItem?.sizes?.length) throw new Error('menu item sizes not found');

        const reloaded = await orderRepo.findOneOrFail({
            where: { id: templateOrder.id },
            relations: ['orderedItems', 'recurrenceSchedule', 'category'],
        });

        const updateDto = plainToInstance(UpdateOrderDto, {
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: menuItem.id,
                    sizeId: menuItem.sizes[0].id,
                    quantity: 1,
                }),
            ],
        });
        await orderService.updateEntityForTest(updateDto, reloaded, dataSource.manager);

        const generatedOrders = await orderRepo.find({
            where: { templateOrderId: templateOrder.id, occurrenceState: OCCURRENCE_STATES.GENERATED },
            relations: ['orderedItems'],
        });
        expect(generatedOrders.length).toBeGreaterThan(0);
        for (const g of generatedOrders) {
            expect(g.orderedItems?.some((i) => i.quantity === 1 && i.menuItem.id === menuItem.id)).toBe(true);
            expect(g.fulfillmentDate.getTime()).toEqual(g.recurrenceDate?.getTime());
        }
        const dates = generatedOrders.map((g) => g.fulfillmentDate.getTime());
        expect(new Set(dates).size).toEqual(dates.length);
    });
});

function sameCalendarDayLocal(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function startOfDayLocal(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
