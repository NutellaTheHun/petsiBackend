import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateInventoryItemPackageDto } from "../dto/inventory-item-package/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/inventory-item-package/update-inventory-item-package.dto";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { BAG_PKG, PACKAGE_PKG } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemTestingUtil } from "../utils/inventory-item-testing.util";
import { InventoryItemPackageValidator } from "./inventory-item-package.validator";

describe('inventory item package validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemPackageValidator;

    let service: InventoryItemPackageService;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        validator = module.get<InventoryItemPackageValidator>(InventoryItemPackageValidator);

        service = module.get<InventoryItemPackageService>(InventoryItemPackageService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            packageName: "CREATE TEST",
        } as CreateInventoryItemPackageDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            packageName: BAG_PKG,
        } as CreateInventoryItemPackageDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual(`Inventory item package with name ${BAG_PKG} already exists`);
    });

    it('should validate update', async () => {
        const toUpdate = await service.findOneByName(BAG_PKG);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            itemCategoryName: "UPDATE TEST",
        } as UpdateInventoryItemPackageDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(BAG_PKG);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            packageName: PACKAGE_PKG,
        } as UpdateInventoryItemPackageDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Inventory item package with name ${PACKAGE_PKG} already exists`);
    });

});