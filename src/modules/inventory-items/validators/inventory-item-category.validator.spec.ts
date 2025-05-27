import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/inventory-item-category/update-inventory-item-category.dto";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { DAIRY_CAT, DRYGOOD_CAT, FOOD_CAT } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemTestingUtil } from "../utils/inventory-item-testing.util";
import { InventoryItemCategoryValidator } from "./inventory-item-category.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('inventory item category validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemCategoryValidator;
    let service: InventoryItemCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        validator = module.get<InventoryItemCategoryValidator>(InventoryItemCategoryValidator);
        service = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        await testingUtil.initInventoryItemCategoryTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            itemCategoryName: "CREATE TEST",
        } as CreateInventoryItemCategoryDto;

        await validator.validateCreate(dto);
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            itemCategoryName: FOOD_CAT,
        } as CreateInventoryItemCategoryDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should validate update', async () => {
        const toUpdate = await service.findOneByName(DRYGOOD_CAT);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            itemCategoryName: "UPDATE TEST",
        } as UpdateInventoryItemCategoryDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(DRYGOOD_CAT);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            itemCategoryName: DAIRY_CAT,
        } as UpdateInventoryItemCategoryDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

});