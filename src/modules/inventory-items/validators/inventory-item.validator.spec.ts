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
        if(!unitPound){ throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if(!unitKilo){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if(!pkgCan){ throw new Error(); }

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
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: "test item",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as CreateInventoryItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if(!unitPound){ throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if(!unitKilo){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if(!pkgCan){ throw new Error(); }

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
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: FOOD_A,
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as CreateInventoryItemDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual(`Inventory item with name ${FOOD_A} already exists`);
    });

    it('should fail create (duplicate itemSizeDtos)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if(!unitPound){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }

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
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: "TEST ITEM",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as CreateInventoryItemDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual('inventory item has duplicate sizing (package/measurement combination)');
    });


    it('should validate update', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if(!unitPound){ throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if(!unitKilo){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if(!pkgCan){ throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!toUpdate){ throw new Error(); }

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
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: "UPDATE ITEM NAME",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toBeNull();
    });

    it('should fail validate update (name exists)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if(!unitPound){ throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if(!unitKilo){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if(!pkgCan){ throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!toUpdate){ throw new Error(); }

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
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: FOOD_A,
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toEqual(`Inventory item with name ${FOOD_A} already exists`);
    });

    it('should fail validate update (duplicate update sizeDtos)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if(!unitPound){ throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if(!unitKilo){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if(!pkgCan){ throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!toUpdate){ throw new Error(); }

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
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
        ] as (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: "UPDATE ITEM NAME",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toEqual('inventory item has duplicate update dtos for the same item size id');
    });

    it('should fail validate update (duplicate create sizeDtos)', async () => {
        const unitPound = await unitService.findOneByName(POUND);
        if(!unitPound){ throw new Error(); }
        const unitKilo = await unitService.findOneByName(KILOGRAM);
        if(!unitKilo){ throw new Error(); }
        const pkgBox = await packageService.findOneByName(BOX_PKG);
        if(!pkgBox){ throw new Error(); }
        const pkgCan = await packageService.findOneByName(CAN_PKG);
        if(!pkgCan){ throw new Error(); }

        const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!toUpdate){ throw new Error(); }

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
                measureUnitId: unitPound.id,
                measureAmount: 1,
                inventoryPackageId: pkgBox.id,
                cost: 1,
            } as UpdateChildInventoryItemSizeDto,
        ] as (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

        const category = await categoryService.findOneByName(DAIRY_CAT);
        if(!category){ throw new Error(); }
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if(!vendor){ throw new Error(); }

        const dto = {
            itemName: "UPDATE ITEM NAME",
            inventoryItemCategoryId: category.id,
            vendorId: vendor.id,
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toEqual('inventory item has duplicate create sizing (package/measurement combination)');
    });
});