import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaItemValidator } from "./inventory-area-item.validator";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { BAG_PKG, BOX_PKG, CAN_PKG, DRY_B, FOOD_A, OTHER_A } from "../../inventory-items/utils/constants";
import { CreateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { FL_OUNCE, KILOGRAM, POUND } from "../../unit-of-measure/utils/constants";
import { InventoryItemPackageService } from "../../inventory-items/services/inventory-item-package.service";
import { UpdateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";
import { item_e } from "../../menu-items/utils/constants";

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

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should pass create with size dto', async () => {
        const unit = await unitService.findOneByName(POUND);
        if(!unit){ throw new Error(); }
        const pkg = await packageService.findOneByName(BOX_PKG);
        if(!pkg){ throw new Error(); }
        const sizeDto = {
            mode: 'create',
            measureAmount: 1,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 1,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }
        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeDto: sizeDto,
        } as CreateInventoryAreaItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: bad size for item', async () => {
        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }

        const badItem = await itemService.findOneByName(DRY_B, ['itemSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeId: badItem.itemSizes[0].id,
        } as CreateInventoryAreaItemDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual('given inventory item size is not valid for the inventory item');
    });

    it('should fail create: itemSizeId and itemSizeDto', async () => {
        const unit = await unitService.findOneByName(POUND);
        if(!unit){ throw new Error(); }
        const pkg = await packageService.findOneByName(BOX_PKG);
        if(!pkg){ throw new Error(); }
        const sizeDto = {
            mode: 'create',
            measureAmount: 1,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 1,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!item){ throw new Error(); }

        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeId: item.itemSizes[0].id,
            countedItemSizeDto: sizeDto,
        } as CreateInventoryAreaItemDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual('inventory area item create dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto');
    });

    it('should fail create: no itemSizeId and no itemSizeDto with inventory item', async () => {
        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }

        const dto = {
            parentInventoryCountId: testCountId,
            countedInventoryItemId: item.id,
            countedAmount: 1,
        } as CreateInventoryAreaItemDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual('inventory area item create dto requires InventoryItemSize id or CreateInventoryItemSizeDto');
    });

    it('should pass update with sizeId', async() => {
        const toUpdate = await areaItemservice.findAll();
        if(!toUpdate){ throw new Error(); }

        const item = await itemService.findOneByName(OTHER_A, ['itemSizes']);
        if(!item){ throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedAmount: 2,
            countedItemSizeId: item.itemSizes[0].id,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate.items[0].id, dto);
        expect(result).toBeNull();
    });

    it('should pass update with update sizeDto', async() => {
        const toUpdate = await areaItemservice.findByItemName(FOOD_A);
        if(!toUpdate){ throw new Error(); }

        const sizes = await itemSizeService.findSizesByItemName(FOOD_A);
        if(!sizes){ throw new Error(); }

        const unit = await unitService.findOneByName(KILOGRAM);
        if(!unit){ throw new Error(); }
        const pkg = await packageService.findOneByName(BAG_PKG);
        if(!pkg){ throw new Error(); }

        const sizeDto = {
            mode: 'update',
            id: sizes[0].id,
            measureAmount: 1,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 10,
        } as UpdateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedAmount: 2,
            countedItemSizeDto: sizeDto,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate[0].id, dto);
        expect(result).toBeNull();
    });

    it('should pass update with create sizeDto', async() => {
        const toUpdate = await areaItemservice.findAll();
        if(!toUpdate){ throw new Error(); }

        const unit = await unitService.findOneByName(FL_OUNCE);
        if(!unit){ throw new Error(); }
        const pkg = await packageService.findOneByName(CAN_PKG);
        if(!pkg){ throw new Error(); }

        const sizeDto = {
            mode: 'create',
            measureAmount: 2,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 3,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedAmount: 2,
            countedItemSizeDto: sizeDto,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate.items[0].id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: itemSizeId and itemSizeDto with inventory item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if(!toUpdate){ throw new Error(); }

        const unit = await unitService.findOneByName(FL_OUNCE);
        if(!unit){ throw new Error(); }
        const pkg = await packageService.findOneByName(CAN_PKG);
        if(!pkg){ throw new Error(); }

        const sizeDto = {
            mode: 'create',
            measureAmount: 2,
            measureUnitId: unit.id,
            inventoryPackageId: pkg.id,
            cost: 3,
        } as CreateChildInventoryItemSizeDto;

        const item = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!item){ throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedItemSizeId: item.itemSizes[0].id,
            countedItemSizeDto: sizeDto,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate.items[0].id, dto);
        expect(result).toEqual('inventory area item update dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto');
    });

    it('should fail update: no itemSizeId and no itemSizeDto with inventory item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if(!toUpdate){ throw new Error(); }

        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate.items[0].id, dto);
        expect(result).toEqual('updating inventory item must be accompanied by updated sizing');
    });

    it('should fail update: bad sizeId for dto item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if(!toUpdate){ throw new Error(); }

        const item = await itemService.findOneByName(FOOD_A);
        if(!item){ throw new Error(); }

        const badItem = await itemService.findOneByName(DRY_B, ['itemSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            countedInventoryItemId: item.id,
            countedItemSizeId: badItem.itemSizes[0].id,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate.items[0].id, dto);
        expect(result).toEqual('inventoryItemSize given is not valid for the inventory item.');
    });

    it('should fail update: bad sizeId for current item', async () => {
        const toUpdate = await areaItemservice.findAll();
        if(!toUpdate){ throw new Error(); }

        const badItem = await itemService.findOneByName(DRY_B, ['itemSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            countedItemSizeId: badItem.itemSizes[0].id,
        } as UpdateInventoryAreaItemDto;

        const result = await validator.validateUpdate(toUpdate.items[0].id, dto);
        expect(result).toEqual('inventoryItemSize given is not valid for the current inventory item.');
    });
});