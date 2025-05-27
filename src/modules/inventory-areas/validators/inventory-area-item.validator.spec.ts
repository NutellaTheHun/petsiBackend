import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";
import { InventoryItemPackageService } from "../../inventory-items/services/inventory-item-package.service";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { BAG_PKG, BOX_PKG, CAN_PKG, DRY_B, FOOD_A, OTHER_A } from "../../inventory-items/utils/constants";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { FL_OUNCE, KILOGRAM, POUND } from "../../unit-of-measure/utils/constants";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaItemValidator } from "./inventory-area-item.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { INVALID, MISSING } from "../../../util/exceptions/error_constants";

describe('inventory area item validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryAreaItemValidator;

    let areaItemservice: InventoryAreaItemService;
    let areaCountservice: InventoryAreaCountService;
    let itemService: InventoryItemService;
    let itemSizeService: InventoryItemSizeService;
    let unitService: UnitOfMeasureService;
    let packageService: InventoryItemPackageService;

    let testCountId: number;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        validator = module.get<InventoryAreaItemValidator>(InventoryAreaItemValidator);

        areaItemservice = module.get<InventoryAreaItemService>(InventoryAreaItemService);
        areaCountservice = module.get<InventoryAreaCountService>(InventoryAreaCountService);
        itemService = module.get<InventoryItemService>(InventoryItemService);
        itemSizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
        unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
        packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        const counts = await areaCountservice.findAll();
        testCountId = counts.items[0].id;
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should pass create with size Id', async () => {
        const item = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item?.id,
            countedAmount: 1,
            countedItemSizeId: item?.itemSizes[0].id,
        } as CreateInventoryAreaItemDto;

        await validator.validateCreate(dto);
    });

    it('should pass create with size dto', async () => {
        const unit = await unitService.findOneByName(POUND);
        if (!unit) { throw new Error(); }
        const pkg = await packageService.findOneByName(BOX_PKG);
        if (!pkg) { throw new Error(); }
        const sizeDto = {
            mode: 'create',
            measureAmount: 1,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 1,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }
        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeDto: sizeDto,
        } as CreateInventoryAreaItemDto;

        await validator.validateCreate(dto);
    });

    it('should fail create: bad size for item', async () => {
        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }

        const badItem = await itemService.findOneByName(DRY_B, ['itemSizes']);
        if (!badItem) { throw new Error(); }

        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeId: badItem.itemSizes[0].id,
        } as CreateInventoryAreaItemDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail create: itemSizeId and itemSizeDto', async () => {
        const unit = await unitService.findOneByName(POUND);
        if (!unit) { throw new Error(); }
        const pkg = await packageService.findOneByName(BOX_PKG);
        if (!pkg) { throw new Error(); }
        const sizeDto = {
            mode: 'create',
            measureAmount: 1,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 1,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if (!item) { throw new Error(); }

        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeId: item.itemSizes[0].id,
            countedItemSizeDto: sizeDto,
        } as CreateInventoryAreaItemDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail create: no itemSizeId and no itemSizeDto with inventory item', async () => {
        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }

        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
        } as CreateInventoryAreaItemDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(MISSING);
        }
    });

    it('should pass update with sizeId', async () => {
        const toUpdate = await areaItemservice.findAll();
        if (!toUpdate) { throw new Error(); }

        const item = await itemService.findOneByName(OTHER_A, ['itemSizes']);
        if (!item) { throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedAmount: 2,
            countedItemSizeId: item.itemSizes[0].id,
        } as UpdateInventoryAreaItemDto;

        await validator.validateUpdate(toUpdate.items[0].id, dto);
    });

    it('should pass update with update sizeDto', async () => {
        const toUpdate = await areaItemservice.findByItemName(FOOD_A);
        if (!toUpdate) { throw new Error(); }

        const sizes = await itemSizeService.findSizesByItemName(FOOD_A);
        if (!sizes) { throw new Error(); }

        const unit = await unitService.findOneByName(KILOGRAM);
        if (!unit) { throw new Error(); }
        const pkg = await packageService.findOneByName(BAG_PKG);
        if (!pkg) { throw new Error(); }

        const sizeDto = {
            mode: 'update',
            id: sizes[0].id,
            measureAmount: 1,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 10,
        } as UpdateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedAmount: 2,
            countedItemSizeDto: sizeDto,
        } as UpdateInventoryAreaItemDto;

        await validator.validateUpdate(toUpdate[0].id, dto);
    });

    it('should pass update with create sizeDto', async () => {
        const toUpdate = await areaItemservice.findAll();
        if (!toUpdate) { throw new Error(); }

        const unit = await unitService.findOneByName(FL_OUNCE);
        if (!unit) { throw new Error(); }
        const pkg = await packageService.findOneByName(CAN_PKG);
        if (!pkg) { throw new Error(); }

        const sizeDto = {
            mode: 'create',
            measureAmount: 2,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 3,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedAmount: 2,
            countedItemSizeDto: sizeDto,
        } as UpdateInventoryAreaItemDto;

        await validator.validateUpdate(toUpdate.items[0].id, dto);
    });

    it('should fail update: itemSizeId and itemSizeDto with inventory item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if (!toUpdate) { throw new Error(); }

        const unit = await unitService.findOneByName(FL_OUNCE);
        if (!unit) { throw new Error(); }
        const pkg = await packageService.findOneByName(CAN_PKG);
        if (!pkg) { throw new Error(); }

        const sizeDto = {
            mode: 'create',
            measureAmount: 2,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 3,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if (!item) { throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedItemSizeId: item.itemSizes[0].id,
            countedItemSizeDto: sizeDto,
        } as UpdateInventoryAreaItemDto;

        try {
            await validator.validateUpdate(toUpdate.items[0].id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail update: no itemSizeId and no itemSizeDto with inventory item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if (!toUpdate) { throw new Error(); }

        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
        } as UpdateInventoryAreaItemDto;

        try {
            await validator.validateUpdate(toUpdate.items[0].id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail update: bad sizeId for dto item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if (!toUpdate) { throw new Error(); }

        const item = await itemService.findOneByName(FOOD_A);
        if (!item) { throw new Error(); }

        const badItem = await itemService.findOneByName(DRY_B, ['itemSizes']);
        if (!badItem) { throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedItemSizeId: badItem.itemSizes[0].id,
        } as UpdateInventoryAreaItemDto;

        try {
            await validator.validateUpdate(toUpdate.items[0].id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail update: bad sizeId for current item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if (!toUpdate) { throw new Error(); }

        const badItem = await itemService.findOneByName(DRY_B, ['itemSizes']);
        if (!badItem) { throw new Error(); }

        const dto = {
            countedItemSizeId: badItem.itemSizes[0].id,
        } as UpdateInventoryAreaItemDto;

        try {
            await validator.validateUpdate(toUpdate.items[0].id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });
});