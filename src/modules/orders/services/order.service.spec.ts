import { TestingModule } from "@nestjs/testing";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderService } from "./order.service";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";

describe('order service', () => {
    let service: OrderService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();

        service = module.get<OrderService>(OrderService);

    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});