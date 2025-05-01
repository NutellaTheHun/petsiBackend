import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderTypeService } from "./order-type.service";
import { CreateOrderTypeDto } from "../dto/create-order-type.dto";
import { UpdateOrderTypeDto } from "../dto/update-order-type.dto";

describe('order type service', () => {
    let service: OrderTypeService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderTypeTestDatabase(dbTestContext);

        service = module.get<OrderTypeService>(OrderTypeService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create an order type', async () => {
        const dto = {
            name: "testType"
        } as CreateOrderTypeDto;

        const result = await service.create(dto);
        expect(result).not.toBeNull();
        expect(result?.name).toEqual("testType");

        testId = result?.id as number;
    });

    it('should find an order type by id', async () => {
        const result = await service.findOne(testId);
        
        expect(result).not.toBeNull();
        expect(result?.name).toEqual("testType");
        expect(result?.id).toEqual(testId);
    });

    it('should find an order type by name', async () => {
        const result = await service.findOneByName("testType");
        
        expect(result).not.toBeNull();
        expect(result?.name).toEqual("testType");
        expect(result?.id).toEqual(testId);
    });

    it('should update an order type name', async () => {
        const dto = {
            name: "updateTestType"
        } as UpdateOrderTypeDto;

        const result = await service.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestType");

        testId = result?.id as number;
    });

    it('should find all order types', async () => {
        const results = await service.findAll();

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(5);

        testIds = results.items.slice(0,3).map(type => type.id);
    });

    it('should get order types by list of ids', async () => {
        const results = await service.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should remove order type', async () => {
        const removal = await service.remove(testId);
        expect(removal).toBeTruthy();

        const verify = await service.findOne(testId);
        expect(verify).toBeNull();
    });
});