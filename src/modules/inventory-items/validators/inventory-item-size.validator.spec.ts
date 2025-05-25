import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { GRAM } from "../../unit-of-measure/utils/constants";
import { UpdateInventoryItemSizeDto } from "../dto/inventory-item-size/update-inventory-item-size.dto";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { CONTAINER_PKG, FOOD_A, OTHER_PKG } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemTestingUtil } from "../utils/inventory-item-testing.util";
import { InventoryItemSizeValidator } from "./inventory-item-size.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('inventory item package validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemSizeValidator;
    let service: InventoryItemSizeService;

    let unitService: UnitOfMeasureService;
    let packageService: InventoryItemPackageService;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        validator = module.get<InventoryItemSizeValidator>(InventoryItemSizeValidator);
        service = module.get<InventoryItemSizeService>(InventoryItemSizeService);
        unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
        packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate update', async () => {
        const toUpdate = await service.findSizesByItemName(FOOD_A);
        if (!toUpdate) { throw new Error(); }

        const unit = await unitService.findOneByName(GRAM);
        if (!unit) { throw new Error(); }
        const pkg = await packageService.findOneByName(OTHER_PKG);
        if (!pkg) { throw new Error(); }

        const dto = {
            measureUnitId: unit.id,
            measureAmount: 1,
            inventoryPackageId: pkg.id,
            cost: 5,
        } as UpdateInventoryItemSizeDto;

        await validator.validateUpdate(toUpdate[0].id, dto);
    });

    it('should fail update (already exists)', async () => {
        const toUpdate = await service.findSizesByItemName(FOOD_A);
        if (!toUpdate) { throw new Error(); }

        const badItem = await service.findOne(toUpdate[0].id, ['measureUnit', 'packageType'])

        const dto = {
            measureUnitId: badItem.measureUnit.id,
            measureAmount: 1,
            inventoryPackageId: badItem.packageType.id,
            cost: 5,
        } as UpdateInventoryItemSizeDto;

        try {
            await validator.validateUpdate(badItem.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should pass update (close to already exists)', async () => {
        const toUpdate = await service.findSizesByItemName(FOOD_A);
        if (!toUpdate) { throw new Error(); }

        const badItem = await service.findOne(toUpdate[0].id, ['measureUnit', 'packageType'])

        const newUnit = await unitService.findOneByName(GRAM);
        if (!newUnit) { throw new Error(); }

        const dto = {
            measureUnitId: newUnit.id,
            measureAmount: 1,
            inventoryPackageId: badItem.packageType.id,
            cost: 5,
        } as UpdateInventoryItemSizeDto;

        await validator.validateUpdate(badItem.id, dto);
    });

    it('should pass update (close to already exists)', async () => {
        const toUpdate = await service.findSizesByItemName(FOOD_A);
        if (!toUpdate) { throw new Error(); }

        const badItem = await service.findOne(toUpdate[0].id, ['measureUnit', 'packageType'])

        const newPkg = await packageService.findOneByName(CONTAINER_PKG);
        if (!newPkg) { throw new Error(); }

        const dto = {
            measureUnitId: badItem.measureUnit.id,
            measureAmount: 1,
            inventoryPackageId: newPkg.id,
            cost: 5,
        } as UpdateInventoryItemSizeDto;

        await validator.validateUpdate(badItem.id, dto);
    });
});