import { TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { DatabaseTestContext } from "../../../test/DatabaseTestContext";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderRecurrenceService } from "./order-recurrence.service";

describe('RecurringOrderScheduleService', () => {

    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    let service: OrderRecurrenceService;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    let orderRepo: Repository<Order>;


    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        dataSource = module.get(DataSource);

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        service = module.get<OrderRecurrenceService>(OrderRecurrenceService);

        orderRepo = module.get(getRepositoryToken(Order));
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });



});