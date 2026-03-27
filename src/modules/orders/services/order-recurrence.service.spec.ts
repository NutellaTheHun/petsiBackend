import { TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { DataSource, EntityManager, Repository } from "typeorm";
import { DatabaseTestContext } from "../../../test/DatabaseTestContext";
import { MenuItemContainerItem } from "../../menu-items/entities/menu-item-container-item.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { MENU_ITEM_TYPES } from "../../menu-items/utils/menu-item-type";
import { NestedCreateOrderContainerItemDto } from "../dto/order-container-item/nested-create-order-container-item.dto";
import { NestedCreateOrderMenuItemDto } from "../dto/order-menu-item/nested-create-order-menu-item.dto";
import { CreateOrderDto } from "../dto/order/create-order.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { NestedCreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { OrderCategory } from "../entities/order-category.entity";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";
import { orderToUpdateDto } from "../utils/entity-transformers/order.dto.transformer";
import { OCCURRENCE_STATES, OCCURRENCE_TYPES } from "../utils/occurence-types";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { getDayOfWeekValue } from "../utils/rrule.util";
import { OrderRecurrenceService } from "./order-recurrence.service";
import { OrderService } from "./order.service";

class TestableOrderService extends OrderService {
    async createEntityForTest(
        dto: CreateOrderDto,
        manager: EntityManager,
    ): Promise<Order> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateOrderDto,
        entity: Order,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

class TestableOrderRecurrenceService extends OrderRecurrenceService {
    async generateRecurringOrdersForTest(
    ): Promise<void> {
        return this.generateRecurringOrders();
    }
    async handleTemplateOrderUpdateForTest(
        templateOrder: Order,
    ): Promise<void> {
        return this.handleTemplateOrderUpdate(templateOrder.id);
    }
    async handleTemplateFulfillmentDateForTest(
        templateOrder: Order,
    ): Promise<void> {
        return this.handleTemplateFulfillmentDate(templateOrder);
    }
    async cloneTemplateToOccurenceForTest(
        templateOrder: Order,
        occurenceDate: Date,
    ): Promise<Order> {
        return this.cloneTemplateToOccurence(templateOrder, occurenceDate);
    }
    async ensureGeneratedOrdersForTest(
        templateOrder: Order,
        horizonDate: Date,
    ): Promise<void> {
        return this.ensureGeneratedOrders(templateOrder, horizonDate);
    }
    async removeFutureGeneratedOrdersForTest(
        templateOrder: Order,
        startDate: Date,
    ): Promise<void> {
        return this.removeFutureGeneratedOrders(templateOrder, startDate);
    }
    async nextOccurenceForTest(
        rrule: string,
        startDate: Date,
    ): Promise<Date> {
        return this.nextOccurence(rrule, startDate);
    }
}

describe('RecurringOrderScheduleService', () => {

    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    let recurrenceService: TestableOrderRecurrenceService;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    let orderRepo: Repository<Order>;
    let orderService: TestableOrderService;

    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;
    let containerItemRepo: Repository<MenuItemContainerItem>;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        dataSource = module.get(DataSource);

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        recurrenceService = module.get(OrderRecurrenceService) as TestableOrderRecurrenceService;
        orderService = module.get(OrderService) as TestableOrderService;

        orderRepo = module.get(getRepositoryToken(Order));
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));

        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(recurrenceService).toBeDefined();
    });

    // test nextOccurence
    it('should return the next occurence date', async () => {
        const rrule = 'DTSTART:20120201T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20130130T230000Z;BYDAY=MO,FR';
        const startDate = new Date('2012-02-01');
        // expected next occurence is 2 days from the start date at 9:30am UTC
        const expectedNextOccurence = new Date(Date.UTC(2012, 1, 3, 9, 30, 0));
        const nextOccurence = await recurrenceService.nextOccurenceForTest(rrule, startDate);
        expect(nextOccurence).toEqual(expectedNextOccurence);
    });

    // test handleTemplateOrderUpdate: Weekly Recurrence, adjusts the fulfillment date to the next occurence date
    it('should handle the template fulfillment date: adjusts the fulfillment date to the next occurence date', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        // last weeks date (offset by 6 days to match the day of the week occurence)
        const startDate = new Date(new Date().setDate(new Date().getDate() - 6));
        const daysOfWeek = getDayOfWeekValue([startDate.getDay()]);

        // weekly occurence with tomorrow's day of week being set to the fulfillment date
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        // Order created with a fulfillment date of last week, with a recurrence set weekly and to occur tomorrow
        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
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
            recurringOrderSchedule: recurrenceCreateDto,
        });
        const templateOrder = await orderService.createEntityForTest(dto, dataSource.manager);

        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);

        // expected fulfillment date to equal tomorrow (month/day/year)
        const expectedFulfillmentDate = new Date(new Date().setDate(new Date().getDate() + 1));
        const fulfillmentDate = templateOrder.fulfillmentDate;
        expect(fulfillmentDate.getFullYear()).toEqual(expectedFulfillmentDate.getFullYear());
        expect(fulfillmentDate.getMonth()).toEqual(expectedFulfillmentDate.getMonth());
        expect(fulfillmentDate.getDate()).toEqual(expectedFulfillmentDate.getDate());
    });

    // test handleTemplateOrderUpdate: Weeky Recurrence, order is up to date, no change
    it('should handle the template order update: no change', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        // next weeks date
        const startDate = new Date(new Date().setDate(new Date().getDate() + 7));
        const daysOfWeek = getDayOfWeekValue([startDate.getDay()]);

        // weekly occurence with todays day of week being set to the fulfillment date
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        // Order created with a fulfillment date of next week, with a recurrence set weekly and to occur on today's day of week
        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
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
            recurringOrderSchedule: recurrenceCreateDto,
        });
        const templateOrder = await orderService.createEntityForTest(dto, dataSource.manager);

        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);

        // expected fulfillment date is the start date to equal the same (month/day/year)
        const expectedFulfillmentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const fulfillmentDate = templateOrder.fulfillmentDate;
        expect(fulfillmentDate.getFullYear()).toEqual(expectedFulfillmentDate.getFullYear());
        expect(fulfillmentDate.getMonth()).toEqual(expectedFulfillmentDate.getMonth());
        expect(fulfillmentDate.getDate()).toEqual(expectedFulfillmentDate.getDate());
    });

    // test handleTemplateOrderUpdate: Monthly Recurrence, order is up to date, updates the fulfillment date to the next occurence date
    it('should handle the template fulfillment date: updates the fulfillment date to the next occurence date', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        // the 1st of the current month
        const startDate = new Date(new Date().setDate(1));

        // monthly occurence with the 1st of the current month being set to the fulfillment date
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            frequency: 'MONTHLY',
            interval: 1,
            dayOfMonth: 1,
            startDate,
        });

        // Order created with a fulfillment date of last week, with a recurrence set weekly and to occur tomorrow
        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
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
            recurringOrderSchedule: recurrenceCreateDto,
        });
        const templateOrder = await orderService.createEntityForTest(dto, dataSource.manager);

        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);

        // expected fulfillment date to equal the first of the next month (month/day/year)
        const expectedFulfillmentDate = new Date(new Date().setMonth(new Date().getMonth() + 1, 1));
        const fulfillmentDate = templateOrder.fulfillmentDate;
        expect(fulfillmentDate.getFullYear()).toEqual(expectedFulfillmentDate.getFullYear());
        expect(fulfillmentDate.getMonth()).toEqual(expectedFulfillmentDate.getMonth());
        expect(fulfillmentDate.getDate()).toEqual(expectedFulfillmentDate.getDate());
    });

    // test handleTemplateOrderUpdate: Monthly Recurrence, order is up to date, no changes
    it('should handle the template fulfillment date: updates the fulfillment date to the next occurence date', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        // the 28th of the current month
        const startDate = new Date(new Date().setDate(28));

        // monthly occurence with the 28th of the current month being set to the fulfillment date
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            frequency: 'MONTHLY',
            interval: 1,
            dayOfMonth: 28,
            startDate,
        });

        // Order created with a fulfillment date of last week, with a recurrence set weekly and to occur tomorrow
        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
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
            recurringOrderSchedule: recurrenceCreateDto,
        });
        const templateOrder = await orderService.createEntityForTest(dto, dataSource.manager);

        await recurrenceService.handleTemplateFulfillmentDateForTest(templateOrder);

        // expected fulfillment date to equal the 28th of the current month (month/day/year)
        const expectedFulfillmentDate = startDate;
        const fulfillmentDate = templateOrder.fulfillmentDate;
        expect(fulfillmentDate.getFullYear()).toEqual(expectedFulfillmentDate.getFullYear());
        expect(fulfillmentDate.getMonth()).toEqual(expectedFulfillmentDate.getMonth());
        expect(fulfillmentDate.getDate()).toEqual(expectedFulfillmentDate.getDate());
    });

    // test cloneTemplateToOccurence
    it('should clone the template order to the occurence date', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        // get menu item of type container
        const mi = await menuItemRepo.findOne({ where: { type: MENU_ITEM_TYPES.CONTAINER }, relations: ['sizes'] });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const menuItemSize = mi.sizes[0];
        // valid container item by size
        const validContainerItems = await containerItemRepo.find({ where: { parentItemSize: { id: menuItemSize.id }, parentMenuItem: { id: mi.id } }, relations: ['containedMenuItem', 'containedItemSize'] });
        if (!validContainerItems?.length) throw new Error('valid container items not found');

        const containedItem = validContainerItems[0];

        // today's date
        const startDate = new Date(new Date().setDate(new Date().getDate()));
        const daysOfWeek = getDayOfWeekValue([startDate.getDay()]);

        // weekly occurence with todays day of week being set to the fulfillment date
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        // Order created with a fulfillment date of today, with a recurrence set weekly and to occur on today's day of week
        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
            fulfillmentType: 'pickup',
            categoryId: cat.id,
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
            recurringOrderSchedule: recurrenceCreateDto,
        });
        const templateOrder = await orderService.createEntityForTest(dto, dataSource.manager);
        if (!templateOrder.recurrenceSchedule) throw new Error('recurrence schedule not found');

        const occurenceDate = await recurrenceService.nextOccurenceForTest(templateOrder.recurrenceSchedule.rrule, startDate);
        const clonedOrder = await recurrenceService.cloneTemplateToOccurenceForTest(templateOrder, occurenceDate);
        // expect cloned order to have the same fulfillment date as the occurence date
        expect(clonedOrder.fulfillmentDate.getFullYear()).toEqual(occurenceDate.getFullYear());
        expect(clonedOrder.fulfillmentDate.getMonth()).toEqual(occurenceDate.getMonth());
        expect(clonedOrder.fulfillmentDate.getDate()).toEqual(occurenceDate.getDate());

        // expect cloned order type to be OCCURRENCE
        expect(clonedOrder.occurrenceType).toEqual(OCCURRENCE_TYPES.OCCURRENCE);
        // expect cloned order to have occurrence state of GENERATED
        expect(clonedOrder.occurrenceState).toEqual(OCCURRENCE_STATES.GENERATED);
        // expect cloned order to have the same template order id as the template order
        expect(clonedOrder.templateOrderId).toEqual(templateOrder.id);
        // expect cloned order to have undefined or null recurrence schedule
        expect(clonedOrder.recurrenceSchedule).toBeNull();
        // expect recurrence date to be the occurence date
        if (!clonedOrder.recurrenceDate) throw new Error('recurrence date not found');
        expect(clonedOrder.recurrenceDate.getFullYear()).toEqual(occurenceDate.getFullYear());
        expect(clonedOrder.recurrenceDate.getMonth()).toEqual(occurenceDate.getMonth());
        expect(clonedOrder.recurrenceDate.getDate()).toEqual(occurenceDate.getDate());

        // expect cloned order to have the same recipient as the template order
        expect(clonedOrder.recipient).toEqual(templateOrder.recipient);
        // expect cloned order to have the same fulfillment type as the template order
        expect(clonedOrder.fulfillmentType).toEqual(templateOrder.fulfillmentType);
        // expect cloned order to have the same category id as the template order
        if (!clonedOrder.category) throw new Error('category not found');
        if (!templateOrder.category) throw new Error('template order category not found');
        expect(clonedOrder.category.id).toEqual(templateOrder.category.id);

        // expect cloned order to have the same ordered items as the template order
        if (!clonedOrder.orderedItems) throw new Error('ordered items not found');
        if (!templateOrder.orderedItems) throw new Error('template order ordered items not found');
        expect(clonedOrder.orderedItems.length).toEqual(templateOrder.orderedItems.length);
        for (let i = 0; i < clonedOrder.orderedItems.length; i++) {
            expect(clonedOrder.orderedItems[i].id).toEqual(templateOrder.orderedItems[i].id);
            // if the ordered item is a container item, expect the same container items
            if (clonedOrder.orderedItems[i].containerOrderMenuItems && clonedOrder.orderedItems[i].containerOrderMenuItems?.length) {
                const containerOrderMenuItem = clonedOrder.orderedItems[i];
                const templateContainerOrderMenuItem = templateOrder.orderedItems[i];
                if (!containerOrderMenuItem.containerOrderMenuItems || !templateContainerOrderMenuItem.containerOrderMenuItems) throw new Error('container order menu items not found');
                expect(containerOrderMenuItem.containerOrderMenuItems.length).toEqual(templateContainerOrderMenuItem.containerOrderMenuItems.length);
                for (let j = 0; j < containerOrderMenuItem.containerOrderMenuItems.length; j++) {
                    expect(containerOrderMenuItem.containerOrderMenuItems[j].id).toEqual(templateContainerOrderMenuItem.containerOrderMenuItems[j].id);
                }
            }
        }
    });

    // test ensureGeneratedOrders
    it('should ensure the generated orders', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        // today's date
        const startDate = new Date(new Date().setDate(new Date().getDate()));
        const daysOfWeek = getDayOfWeekValue([startDate.getDay()]);

        // weekly occurence with today's day of week being set to the fulfillment date
        const recurrenceCreateDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek,
            startDate,
        });

        // Order created with a fulfillment date of today, with a recurrence set weekly and to occur today's day of week
        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Test Recipient',
            fulfillmentDate: startDate,
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
            recurringOrderSchedule: recurrenceCreateDto,
        });
        const templateOrder = await orderService.createEntityForTest(dto, dataSource.manager);

        const horizonDate = new Date(new Date().setDate(new Date().getDate() + 45));
        await recurrenceService.ensureGeneratedOrdersForTest(templateOrder, horizonDate);

        const generatedOrders = await orderRepo.find({ where: { templateOrderId: templateOrder.id, occurrenceState: OCCURRENCE_STATES.GENERATED } });
        expect(generatedOrders.length).toEqual(6);
    });

    // test removeFutureGeneratedOrders
    it('should remove the future generated orders', async () => {
        const generatedOrder = await orderRepo.findOneOrFail({ where: { occurrenceState: OCCURRENCE_STATES.GENERATED } });
        if (!generatedOrder.templateOrderId) throw new Error('generated order template order id not found');
        const templateOrder = await orderRepo.findOneOrFail({ where: { id: generatedOrder.templateOrderId } });
        const generatedOrders = await orderRepo.find({ where: { templateOrderId: templateOrder.id, occurrenceState: OCCURRENCE_STATES.GENERATED } });
        if (!generatedOrders.length) throw new Error('generated orders not found');

        await recurrenceService.removeFutureGeneratedOrdersForTest(templateOrder, new Date(new Date().setDate(new Date().getDate())));
        const remainingGeneratedOrders = await orderRepo.find({ where: { templateOrderId: templateOrder.id, occurrenceState: OCCURRENCE_STATES.GENERATED } });
        expect(remainingGeneratedOrders.length).toEqual(0);
    });

    // test handleTemplateOrderUpdate
    it("should handle the template order update", async () => {
        const templateOrder = await orderRepo.findOneOrFail({ where: { occurrenceType: OCCURRENCE_TYPES.TEMPLATE }, relations: ['orderedItems'] });
        if (!templateOrder.orderedItems) throw new Error('template order ordered items not found');

        const originalOrderItemsCount = templateOrder.orderedItems.length;

        const menuItem = await menuItemRepo.findOneOrFail({ where: {}, relations: ['sizes'] });
        if (!menuItem?.sizes?.length) throw new Error('menu item sizes not found');

        const newFulfillmentDate = new Date(new Date().setDate(templateOrder.fulfillmentDate.getDate() + 1));

        // set the order fulfillment date to one day ahead of current fulfillment date
        const updateDto = orderToUpdateDto(templateOrder, {
            fulfillmentDate: newFulfillmentDate,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: menuItem.id,
                    sizeId: menuItem.sizes[0].id,
                    quantity: 1,
                }),
            ],
            recurrenceSchedule: plainToInstance(NestedCreateRecurringOrderScheduleDto, {
                daysOfWeek: getDayOfWeekValue([newFulfillmentDate.getDay()]),
                startDate: newFulfillmentDate,
            }),
        });
        await orderService.updateEntityForTest(updateDto, templateOrder, dataSource.manager);

        // get expected fulfillment dates with new fulfillment date up to 45 days from now
        const expectedFulfillmentDates: Date[] = [];
        for (let i = 0; i < 45; i++) {
            if (i % 7 === 0) {
                expectedFulfillmentDates.push(new Date(new Date().setDate(newFulfillmentDate.getDate() + i)));
            }
        }

        // expect generated orders with 45 day horizon date
        const generatedOrders = await orderRepo.find({ where: { templateOrderId: templateOrder.id, occurrenceState: OCCURRENCE_STATES.GENERATED } });
        expect(generatedOrders.length).toEqual(6);
        for (let i = 0; i < generatedOrders.length; i++) {
            expect(generatedOrders[i].orderedItems?.length).toEqual(originalOrderItemsCount + 1);
            // expect generated order fulfillment date and recurrence date to be the same
            expect(generatedOrders[i].fulfillmentDate.getFullYear()).toEqual(generatedOrders[i].recurrenceDate?.getFullYear());
            expect(generatedOrders[i].fulfillmentDate.getMonth()).toEqual(generatedOrders[i].recurrenceDate?.getMonth());
            expect(generatedOrders[i].fulfillmentDate.getDate()).toEqual(generatedOrders[i].recurrenceDate?.getDate());

            // expect generated order fulfilment date to be found within the expected fulfillment dates
            expect(expectedFulfillmentDates.some(date => date.getTime() === generatedOrders[i].fulfillmentDate.getTime())).toBeTruthy();
        }
        // expect all generated orders to have different fulfillment dates
        for (let i = 0; i < generatedOrders.length; i++) {
            for (let j = i + 1; j < generatedOrders.length; j++) {
                expect(generatedOrders[i].fulfillmentDate.getTime()).not.toEqual(generatedOrders[j].fulfillmentDate.getTime());
            }
        }
    });
});