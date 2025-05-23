import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/inventory-item-category/update-inventory-item-category.dto";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { DAIRY_CAT, DRYGOOD_CAT, FOOD_CAT } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemTestingUtil } from "../utils/inventory-item-testing.util";
import { InventoryItemCategoryValidator } from "./inventory-item-category.validator";

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

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            itemCategoryName: FOOD_CAT,
        } as CreateInventoryItemCategoryDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual(`Inventory category with name ${FOOD_CAT} already exists`);
    });

    it('should validate update', async () => {
        const toUpdate = await service.findOneByName(DRYGOOD_CAT);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            itemCategoryName: "UPDATE TEST",
        } as UpdateInventoryItemCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(DRYGOOD_CAT);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            itemCategoryName: DAIRY_CAT,
        } as UpdateInventoryItemCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Inventory category with name ${DAIRY_CAT} already exists`);
    });

});