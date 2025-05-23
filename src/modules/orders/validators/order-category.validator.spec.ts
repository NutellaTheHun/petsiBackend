import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";
import { OrderCategoryService } from "../services/order-category.service";
import { TYPE_A, TYPE_B } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderCategoryValidator } from "./order-category.validator";

describe('order category validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderCategoryValidator;
    let service: OrderCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        validator = module.get<OrderCategoryValidator>(OrderCategoryValidator);
        service = module.get<OrderCategoryService>(OrderCategoryService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderCategoryTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            categoryName: "TEST NAME"
        } as CreateOrderCategoryDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            categoryName: TYPE_A
        } as CreateOrderCategoryDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Order category with name ${TYPE_A} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(TYPE_A);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            categoryName: "UPDATE TEST"
        } as UpdateOrderCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(TYPE_A);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            categoryName: TYPE_B
        } as UpdateOrderCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });
});