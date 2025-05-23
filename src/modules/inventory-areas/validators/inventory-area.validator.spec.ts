import { TestingModule } from "@nestjs/testing";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaValidator } from "./inventory-area.validator";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { AREA_A } from "../utils/constants";
import { InventoryAreaService } from "../services/inventory-area.service";

describe('inventory area validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryAreaValidator;
    let service: InventoryAreaService;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        validator = module.get<InventoryAreaValidator>(InventoryAreaValidator);
        service = module.get<InventoryAreaService>(InventoryAreaService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            areaName: "testValidateArea"
        } as CreateInventoryAreaDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            areaName: AREA_A,
        } as CreateInventoryAreaDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Inventory with name ${AREA_A} already exists`);
    });

    it('should pass update', async () => {
        const area = await service.findOneByName(AREA_A);
        if (!area) { throw new Error(); }

        const dto = {
            areaName: "testValidateArea"
        } as UpdateInventoryAreaDto;
        const result = await validator.validateUpdate(area.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const area = await service.findOneByName(AREA_A);
        if (!area) { throw new Error(); }

        const dto = {
            areaName: AREA_A
        } as UpdateInventoryAreaDto;

        const result = await validator.validateUpdate(area.id, dto);
        expect(result).toEqual(`Inventory with name ${AREA_A} already exists`);
    });
});