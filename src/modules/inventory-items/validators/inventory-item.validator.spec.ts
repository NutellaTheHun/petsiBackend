import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { KILOGRAM, POUND } from "../../unit-of-measure/utils/constants";
import { CreateChildInventoryItemSizeDto } from "../dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../dto/inventory-item-size/update-child-inventory-item-size.dto";
import { CreateInventoryItemDto } from "../dto/inventory-item/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/inventory-item/update-inventory-item.dto";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { InventoryItemService } from "../services/inventory-item.service";
import { BOX_PKG, CAN_PKG, DAIRY_CAT, FOOD_A, VENDOR_A } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemTestingUtil } from "../utils/inventory-item-testing.util";
import { InventoryItemValidator } from "./inventory-item.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { DUPLICATE, EXIST } from "../../../util/exceptions/error_constants";

describe('inventory item validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemValidator;
    let itemService: InventoryItemService;

    let categoryService: InventoryItemCategoryService;
    let vendorService: InventoryItemVendorService;
    let unitService: UnitOfMeasureService;
    let packageService: InventoryItemPackageService;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        validator = module.get<InventoryItemValidator>(InventoryItemValidator);

        itemService = module.get<InventoryItemService>(InventoryItemService);
        categoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
        vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
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

    it('should validate create', async () => {

        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if (!unitKilo) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if (!pkgCan) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'create',
                measureUnitId: unitKilo.id,
                measureAmount: 1,
                inventoryPackageId: pkgCan.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
        ] as CreateChildInventoryItemSizeDto[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: "test item",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as CreateInventoryItemDto;

        await validator.validateCreate(dto);
    });

    it('should fail create (name already exists)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if (!unitKilo) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if (!pkgCan) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'create',
                measureUnitId: unitKilo.id,
                measureAmount: 1,
                inventoryPackageId: pkgCan.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
        ] as CreateChildInventoryItemSizeDto[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: FOOD_A,
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as CreateInventoryItemDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should fail create (duplicate itemSizeDtos)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
        ] as CreateChildInventoryItemSizeDto[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: "TEST ITEM",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as CreateInventoryItemDto;


        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(DUPLICATE);
        }
    });


    it('should validate update', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if (!unitKilo) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if (!pkgCan) { throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if (!toUpdate) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'update',
                id: toUpdate.itemSizes[0].id,
                measureUnitId: unitKilo.id,
                measureAmount: 1,
                inventoryPackageId: pkgCan.id,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
        ] as (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: "UPDATE ITEM NAME",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail validate update (name exists)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if (!unitKilo) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if (!pkgCan) { throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if (!toUpdate) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'update',
                id: toUpdate.itemSizes[0].id,
                measureUnitId: unitKilo.id,
                measureAmount: 1,
                inventoryPackageId: pkgCan.id,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
        ] as (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: FOOD_A,
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should fail validate update (duplicate update sizeDtos)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if (!unitKilo) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if (!pkgCan) { throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if (!toUpdate) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'update',
                id: toUpdate.itemSizes[0].id,
                measureUnitId: unitKilo.id,
                measureAmount: 1,
                inventoryPackageId: pkgCan.id,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
            {
                mode: 'update',
                id: toUpdate.itemSizes[0].id,
                measureUnitId: unitPound.id,
                measureAmount: 1,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
        ] as (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: "UPDATE ITEM NAME",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(DUPLICATE);
        }
    });

    it('should fail validate update (duplicate create sizeDtos)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if (!unitPound) { throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if (!unitKilo) { throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if (!pkgBox) { throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if (!pkgCan) { throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if (!toUpdate) { throw new Error(); }

        const sizeDtos = [
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'create',
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as CreateChildInventoryItemSizeDto,
            {
                mode: 'update',
                id: toUpdate.itemSizes[0].id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
        ] as (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new Error(); }

        const dto = {
            itemName: "UPDATE ITEM NAME",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(DUPLICATE);
        }
    });
});