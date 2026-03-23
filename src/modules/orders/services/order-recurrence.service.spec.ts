import { TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { DatabaseTestContext } from "../../../test/DatabaseTestContext";
import { CreateOrderDto } from "../dto/order/create-order.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
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
        return this.handleTemplateOrderUpdate(templateOrder);
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
        const expectedNextOccurence = new Date('2012-02-03');
        const nextOccurence = await recurrenceService.nextOccurenceForTest(rrule, startDate);
        expect(nextOccurence).toEqual(expectedNextOccurence);
    });

    // test handleTemplateFulfillmentDate

    // test cloneTemplateToOccurence

    // test ensureGeneratedOrders

    // test removeFutureGeneratedOrders

    // test handleTemplateOrderUpdate

    // test generateRecurringOrders
});