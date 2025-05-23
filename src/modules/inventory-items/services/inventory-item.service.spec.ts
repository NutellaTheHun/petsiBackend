import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { GALLON } from '../../unit-of-measure/utils/constants';
import { CreateChildInventoryItemSizeDto } from '../dto/inventory-item-size/create-child-inventory-item-size.dto';
import { UpdateChildInventoryItemSizeDto } from '../dto/inventory-item-size/update-child-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { DAIRY_CAT, DRYGOOD_CAT, FOOD_CAT, OTHER_PKG, VENDOR_A, VENDOR_B } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemService } from './inventory-item.service';

describe('Inventory Item Service', () => {
    let module: TestingModule;
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let itemService: InventoryItemService;

    let testId: number;
    let testIds: number[];
    let invItemSizesTestId: number;
    let oldCategoryId: number;
    let newCategoryId: number;
    let oldVendorId: number;
    let newVendorId: number;
    let sizeId: number;

    let updateItemSizeId: number;
    let updateItemPkgId: number;
    let newUnitId: number;
    let newPkgId: number;
    let deletedSizeId: number;
    let savedSizeId: number;

    let removalId: number;
    let removalCategoryId: number;
    let removalVendorId: number;
    let removalSizeId: number;

    let categoryService: InventoryItemCategoryService;
    let packageService: InventoryItemPackageService;
    let sizeService: InventoryItemSizeService;
    let vendorService: InventoryItemVendorService;
    let measureService: UnitOfMeasureService;



    beforeAll(async () => {
        module = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

        categoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
        vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
        packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);

        measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
        sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
        itemService = module.get<InventoryItemService>(InventoryItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    })

    it('should be defined', () => {
        expect(itemService).toBeDefined();
    });

    // create
    it('should create an inventory-item (Default Category and Vendor)', async () => {
        const dto = {
            itemName: "test item default vend/cat",
        } as CreateInventoryItemDto;
        const result = await itemService.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.itemName).toEqual("test item default vend/cat");

        testId = result?.id as number;
    });

    it('should create an inventory-item with category and vendor', async () => {
        const cat = await categoryService.findOneByName(FOOD_CAT);
        if (!cat) { throw new NotFoundException(); }

        const vend = await vendorService.findOneByName(VENDOR_A);
        if (!vend) { throw new NotFoundException(); }

        const dto = {
            itemName: "test Item with vend/cat",
            vendorId: vend.id,
            inventoryItemCategoryId: cat.id,
        } as CreateInventoryItemDto;
        const result = await itemService.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.itemName).toEqual("test Item with vend/cat");
        expect(result?.category?.categoryName).toEqual(FOOD_CAT);
        expect(result?.vendor?.vendorName).toEqual(VENDOR_A);
    });

    // should create inventory-item with item sizes
    it('should create an inventory item with item sizes', async () => {
        // packageIds
        const packageIds = (await packageService.findAll()).items.map(pkg => pkg.id).slice(0, 2);
        // measureIds
        const measureIds = (await measureService.findAll()).items.map(unit => unit.id).slice(0, 2);

        const sizeDtos = testingUtil.createChildInventoryItemSizeDtos(
            2,
            packageIds,
            measureIds,
            [9.99, 12],
        );

        const cat = await categoryService.findOneByName(DRYGOOD_CAT);
        if (!cat) { throw new NotFoundException(); }

        const vend = await vendorService.findOneByName(VENDOR_B);
        if (!vend) { throw new NotFoundException(); }

        const itemDto = {
            itemName: "testItemWithSizeDtos",
            itemSizeDtos: sizeDtos,
            vendorId: vend.id,
            inventoryItemCategoryId: cat.id,

        } as CreateInventoryItemDto;

        const result = await itemService.create(itemDto);
        if (!result?.itemSizes) { throw new Error("result sizes is null"); }

        expect(result).not.toBeNull();
        expect(result?.itemName).toEqual("testItemWithSizeDtos")
        expect(result.itemSizes.length).toEqual(2);
        for (const size of result.itemSizes) {
            expect(measureIds.findIndex(id => id === size.measureUnit.id)).not.toEqual(-1);
            expect(packageIds.findIndex(id => id === size.packageType.id)).not.toEqual(-1);
            expect(["9.99", "12"]).toContain(size.cost);
        }

        invItemSizesTestId = result?.id as number;
    });

    // find one by name
    it('should find an item by name', async () => {
        const result = await itemService.findOneByName("test item default vend/cat");
        expect(result?.id).not.toBeNull();
        expect(result?.itemName).toEqual("test item default vend/cat");
    });

    //findOne by ID
    it('should find an item by ID', async () => {
        const result = await itemService.findOne(testId);
        expect(result?.id).not.toBeNull();
        expect(result?.itemName).toEqual("test item default vend/cat");
    });

    // update
    it('should update item name', async () => {
        const dto = {
            itemName: "Updated item name"
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.itemName).toEqual("Updated item name");
    });

    it('should update item category', async () => {
        const category = await categoryService.findOneByName(DAIRY_CAT);
        if (!category) { throw new NotFoundException(); }

        const dto = {
            inventoryItemCategoryId: category.id
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.category?.id).toEqual(category.id);

        oldCategoryId = category.id;
    });

    it('new category should gain reference to item', async () => {
        const oldCat = await categoryService.findOne(oldCategoryId, ['categoryItems']);
        if (!oldCat) { throw new NotFoundException(); }

        expect(oldCat.categoryItems.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update item category to a new category', async () => {
        const category = await categoryService.findOneByName(DRYGOOD_CAT);
        if (!category) { throw new NotFoundException(); }

        const dto = {
            inventoryItemCategoryId: category.id
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.category?.id).toEqual(category.id);

        newCategoryId = category.id;
    });

    it('old item category should loose reference to item', async () => {
        const oldCat = await categoryService.findOne(oldCategoryId, ['categoryItems']);
        if (!oldCat) { throw new NotFoundException(); }

        expect(oldCat.categoryItems.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('new item category should gain reference to item', async () => {
        const newCat = await categoryService.findOne(newCategoryId, ['categoryItems']);
        if (!newCat) { throw new NotFoundException(); }

        expect(newCat.categoryItems.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update item category to no category', async () => {
        const dto = {
            inventoryItemCategoryId: null,
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.category).toBeNull();
    });

    it('old item category should loose reference to item', async () => {
        const newCat = await categoryService.findOne(newCategoryId, ['categoryItems']);
        if (!newCat) { throw new NotFoundException(); }

        expect(newCat.categoryItems.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('should update item vendor', async () => {
        const vendor = await vendorService.findOneByName(VENDOR_A);
        if (!vendor) { throw new NotFoundException(); }

        const dto = {
            vendorId: vendor.id
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.vendor?.id).toEqual(vendor.id);

        oldVendorId = vendor.id;
    });

    it('vendor should gain reference to item', async () => {
        const oldVend = await vendorService.findOne(oldVendorId, ['vendorItems']);
        if (!oldVend) { throw new NotFoundException(); }

        expect(oldVend.vendorItems.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update item vendor to a new vendor', async () => {
        const vendor = await vendorService.findOneByName(VENDOR_B);
        if (!vendor) { throw new NotFoundException(); }

        const dto = {
            vendorId: vendor.id
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.vendor?.id).toEqual(vendor.id);

        newVendorId = vendor.id;
    });

    it('old vendor should loose reference to item', async () => {
        const oldVend = await vendorService.findOne(oldVendorId, ['vendorItems']);
        if (!oldVend) { throw new NotFoundException(); }

        expect(oldVend.vendorItems.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('new vendor should gain reference to item', async () => {
        const newVend = await vendorService.findOne(newVendorId, ['vendorItems']);
        if (!newVend) { throw new NotFoundException(); }

        expect(newVend.vendorItems.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update item vendor to no vendor', async () => {

        const dto = {
            vendorId: null,
        } as UpdateInventoryItemDto;
        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.vendor).toBeNull();
    });

    it('old vendor should loose reference to item', async () => {
        const newVend = await vendorService.findOne(newVendorId, ['vendorItems']);
        if (!newVend) { throw new NotFoundException(); }

        expect(newVend.vendorItems.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('should modify a item size, and item should gain reference to modified size', async () => {
        const item = await itemService.findOne(invItemSizesTestId, ['itemSizes']);
        if (!item) { throw new NotFoundException(); }
        if (!item.itemSizes) { throw new Error("item sizes are null"); }

        const sizes = await sizeService.findEntitiesById(item.itemSizes.map(size => size.id), ['inventoryItem', 'measureUnit', 'packageType']);
        if (!sizes) { throw new Error("queried sizes are null"); }

        updateItemSizeId = item.itemSizes[0].id;

        const itemSizes = await sizeService.findEntitiesById(item.itemSizes.map(size => size.id), ['measureUnit', 'packageType'])

        const itemUnitSizeIds = itemSizes.map(size => size.measureUnit.id);
        const itemPkgIds = itemSizes.map(size => size.packageType.id);

        const units = (await measureService.findAll()).items;
        const pkgs = (await packageService.findAll()).items;

        const newUnits = units.filter(unit => !itemUnitSizeIds.find(itemSize => itemSize === unit.id));
        const newPkgs = pkgs.filter(pkg => !itemPkgIds.find(itemPkg => itemPkg === pkg.id));

        const updateSizeDtos = [
            {
                mode: 'update',
                id: item.itemSizes[0].id,
                measureUnitId: newUnits[0].id,
                inventoryPackageTypeId: newPkgs[0].id,
                cost: 12.50,
            } as UpdateChildInventoryItemSizeDto,
            {
                mode: 'update',
                id: item.itemSizes[1].id,
                measureUnitId: newUnits[1].id,
                inventoryPackageTypeId: newPkgs[1].id,
            } as UpdateChildInventoryItemSizeDto,
        ]

        const updateDto = {
            itemSizeDtos: updateSizeDtos,
        } as UpdateInventoryItemDto

        const result = await itemService.update(invItemSizesTestId, updateDto);
        if (!result) { throw new Error("item update is null"); }
        if (!result?.itemSizes) { throw new Error("result sizes is null"); }

        expect(result).not.toBeNull();
        expect(result.itemSizes.length).toEqual(2);

        // should reflect updated item size when queried
        const updatedSize = await sizeService.findOne(updateItemSizeId, ['measureUnit']);
        if (!updatedSize) { throw new NotFoundException(); }
        expect(updatedSize.measureUnit.id).toEqual(newUnits[0].id);

        expect(updatedSize.cost).toEqual("12.50");
    });

    it('should update inventory item with removed item size', async () => {
        const item = await itemService.findOne(invItemSizesTestId, ['itemSizes']);
        if (!item) { throw new NotFoundException(); }
        if (!item.itemSizes) { throw new Error("item sizes are null"); }

        const sizes = await sizeService.findEntitiesById(item.itemSizes.map(size => size.id), ['inventoryItem', 'measureUnit', 'packageType']);
        if (!sizes) { throw new Error("queried sizes are null"); }

        deletedSizeId = sizes[0].id;
        savedSizeId = sizes[1].id;

        const updateSizeDtos = [
            {
                mode: 'update',
                id: sizes[1].id,
            } as UpdateChildInventoryItemSizeDto,
        ];

        const updateDto = {
            itemSizeDtos: updateSizeDtos,
        } as UpdateInventoryItemDto

        const result = await itemService.update(invItemSizesTestId, updateDto);
        if (!result) { throw new Error("item update is null"); }
        if (!result?.itemSizes) { throw new Error("result sizes is null"); }

        expect(result).not.toBeNull();
        expect(result.itemSizes.length).toEqual(1);
        expect(result.itemSizes[0].id).toEqual(savedSizeId);
    });

    it('deleted itemSize from item update should not exist', async () => {
        await expect(sizeService.findOne(deletedSizeId)).rejects.toThrow(NotFoundException);
    });

    it('should update item with both a new and modified size', async () => {
        const item = await itemService.findOne(invItemSizesTestId, ['itemSizes']);
        if (!item) { throw new NotFoundException(); }
        if (!item.itemSizes) { throw new Error("item sizes are null"); }

        const sizes = await sizeService.findEntitiesById(item.itemSizes.map(size => size.id), ['inventoryItem', 'measureUnit', 'packageType']);
        if (!sizes) { throw new Error("queried sizes are null"); }

        updateItemPkgId = item.itemSizes[0].id;

        const itemUnitSizeIds = sizes.map(size => size.measureUnit.id);
        const itemPkgIds = sizes.map(size => size.packageType.id);

        const units = (await measureService.findAll()).items;
        const pkgs = (await packageService.findAll()).items;

        const newUnits = units.filter(unit => !itemUnitSizeIds.find(itemSize => itemSize === unit.id));
        const newPkgs = pkgs.filter(pkg => !itemPkgIds.find(itemPkg => itemPkg === pkg.id));

        const createUnit = await measureService.findOneByName(GALLON)
        if (!createUnit) { throw new NotFoundException(); }
        const createPkg = await packageService.findOneByName(OTHER_PKG)
        if (!createPkg) { throw new NotFoundException(); }

        const sizeDtos = [
            {
                mode: 'update',
                id: sizes[0].id,
                measureUnitId: newUnits[0].id,
                inventoryPackageId: newPkgs[0].id,
            } as UpdateChildInventoryItemSizeDto,
            {
                mode: 'create',
                measureUnitId: createUnit.id,
                inventoryPackageId: createPkg.id,
                cost: 7.01,
                measureAmount: 1,
            } as CreateChildInventoryItemSizeDto,
        ]

        const updateDto = {
            itemSizeDtos: sizeDtos,
        } as UpdateInventoryItemDto

        const result = await itemService.update(invItemSizesTestId, updateDto);
        if (!result) { throw new Error("item update is null"); }
        if (!result?.itemSizes) { throw new Error("result sizes is null"); }

        expect(result).not.toBeNull();
        expect(result.itemSizes.length).toEqual(2);
    });

    //find ALL
    it('should get all items', async () => {
        const results = await itemService.findAll({ limit: 20 });
        expect(results.items.length).toEqual(12) //9 from initTestItems, 3 from create methods

        testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
    });

    //find by IDS
    it('should get items by list of ids', async () => {
        const results = await itemService.findEntitiesById(testIds);
        expect(results.length).toEqual(testIds.length);
    });

    // remove
    it('should remove an item', async () => {
        const itemToRemove = await itemService.findOne(invItemSizesTestId, ['itemSizes', 'category', 'vendor']);
        if (!itemToRemove) { throw new NotFoundException(); }
        if (!itemToRemove.itemSizes) { throw new Error("sizes is null"); }
        expect(itemToRemove.itemSizes?.length).toBeGreaterThan(0);

        removalId = itemToRemove.id;
        removalVendorId = itemToRemove.vendor?.id as number;
        removalCategoryId = itemToRemove.category?.id as number;
        removalSizeId = itemToRemove.itemSizes[0].id as number;

        const removal = await itemService.remove(removalId);
        expect(removal).toBeTruthy();
    });

    it('removed item\'s vendor should lose reference to item', async () => {
        const vendor = await vendorService.findOne(removalVendorId, ['vendorItems']);
        if (!vendor) { throw new NotFoundException(); }
        expect(vendor.vendorItems.findIndex(item => item.id === removalId)).toEqual(-1);
    });

    it('removed item\'s category should lose reference to item', async () => {
        const category = await categoryService.findOne(removalCategoryId, ['categoryItems']);
        if (!category) { throw new NotFoundException(); }
        expect(category.categoryItems.findIndex(item => item.id === removalId)).toEqual(-1);
    });

    it('removed item\'s sizes should be deleted', async () => {
        const sizes = await sizeService.findSizesByItemName("testItemWithSizeDtos");
        expect(sizes?.length).toEqual(0);
    });
});