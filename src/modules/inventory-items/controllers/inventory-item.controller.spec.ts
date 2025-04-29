import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemService } from '../services/inventory-item.service';
import { CLEANING_CAT, DAIRY_CAT, DRY_A, DRY_B, DRY_C, DRYGOOD_CAT, FOOD_A, FOOD_B, FOOD_C, FOOD_CAT, FROZEN_CAT, OTHER_A, OTHER_B, OTHER_C, OTHER_CAT, PAPER_CAT, PRODUCE_CAT, VENDOR_A, VENDOR_B, VENDOR_C } from "../utils/constants";
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemController } from './inventory-item.controller';


describe('Inventory Item Controller', () => {
  let controller: InventoryItemController;
  let itemService: InventoryItemService;

  let items: InventoryItem[];
  let itemId = 1;

  let categories: InventoryItemCategory[];
  let catId = 1;

  let vendors: InventoryItemVendor[];
  let vendId = 1;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemController>(InventoryItemController);
    itemService = module.get<InventoryItemService>(InventoryItemService);

    vendors = [
      { name: VENDOR_A } as InventoryItemVendor,
      { name: VENDOR_B } as InventoryItemVendor,
      { name: VENDOR_C } as InventoryItemVendor,
    ];
    vendors.map(vendor => vendor.id = vendId++);

    categories = [
      { name: CLEANING_CAT } as InventoryItemCategory,
      { name: DAIRY_CAT } as InventoryItemCategory,
      { name: DRYGOOD_CAT } as InventoryItemCategory,
      { name: FOOD_CAT } as InventoryItemCategory,
      { name: FROZEN_CAT } as InventoryItemCategory,
      { name: OTHER_CAT } as InventoryItemCategory,
      { name: PAPER_CAT } as InventoryItemCategory,
      { name: PRODUCE_CAT } as InventoryItemCategory,
    ];
    categories.map(category => category.id = catId++);

    items = [
      { name: FOOD_A, category: categories[3], vendor: vendors[0] } as InventoryItem,
      { name: DRY_A, category: categories[2], vendor: vendors[0] } as InventoryItem,
      { name: OTHER_A, category: categories[5], vendor: vendors[0] } as InventoryItem,

      { name: FOOD_B, category: categories[3], vendor: vendors[1] } as InventoryItem,
      { name: DRY_B, category: categories[2], vendor: vendors[1] } as InventoryItem,
      { name: OTHER_B, category: categories[5], vendor: vendors[1] } as InventoryItem,
    
      { name: FOOD_C, category: categories[3], vendor: vendors[2] } as InventoryItem,
      { name: DRY_C, category: categories[2], vendor: vendors[2] } as InventoryItem,
      { name: OTHER_C, category: categories[5], vendor: vendors[2] } as InventoryItem,
    ];
    items.map(item => item.id = itemId++);

    jest.spyOn(itemService, "create").mockImplementation(async (createDto: CreateInventoryItemDto) => {
      const exists = items.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      
      const category = categories.find(c => c.id === createDto.inventoryItemCategoryId);
      const vendor = vendors.find(v => v.id === createDto.vendorId);
      const unit = { id: 0, name: createDto.name, vendor, category } as InventoryItem;
      unit.id = itemId++;
      items.push(unit);
      return unit;
    });

    jest.spyOn(itemService, "findOneByName").mockImplementation(async (name: string) => {
      return items.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(itemService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemDto) => {
      const index = items.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const toUpdate = items[index];

      let category = toUpdate.category
      let vendor = toUpdate.vendor

      if(updateDto.inventoryItemCategoryId){
        let category = categories.find(c => c.id === updateDto.inventoryItemCategoryId);
      }
      if(updateDto.vendorId){
        let vendor = vendors.find(v => v.id === updateDto.vendorId);
      }
      const updated = { id, name: updateDto.name, vendor, category } as InventoryItem;

      items[index] = updated;

      return updated;
    });

    jest.spyOn(itemService, "findAll").mockResolvedValue( {items: items} );

    jest.spyOn(itemService, "findOne").mockImplementation(async (id: number) => {
      return items.find(unit => unit.id === id) || null;
    });

    jest.spyOn(itemService, "remove").mockImplementation( async (id: number) => {
      const index = items.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      items.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a item', async () => {
    const dto = {
      name: "testItem",
      inventoryItemCategoryId: 1,
      vendorId: 1,
    } as CreateInventoryItemDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a item (already exists)', async () => {
    const dto = {
      name: "testItem",
      inventoryItemCategoryId: 1,
      vendorId: 1,
    } as CreateInventoryItemDto;

    const result = await controller.create(dto)
    expect(result).toBeNull();
  });

  it('should return all items', async () => {
    const results = await controller.findAll();
    expect(results.items.length).toEqual(items.length);
  });
  
  it('should return a item by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a item (bad id, returns null)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });
  
  it('should update a item', async () => {
    const toUpdate = await itemService.findOneByName("testItem");
    if(!toUpdate){ throw new Error("item to update not found"); }

    const dto = {
      name: "UPDATED_testItem",
    } as UpdateInventoryItemDto;

    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_testItem")
  });
  
  it('should fail to update a item (doesnt exist)', async () => {
    const toUpdate = await itemService.findOneByName("UPDATED_testItem");
    if(!toUpdate){ throw new Error("item to update not found"); }

    const result = await controller.update(0, toUpdate);
    expect(result).toBeNull();
  });
  
  it('should remove a item', async () => {
    const toRemove = await itemService.findOneByName("UPDATED_testItem");
    if(!toRemove){ throw new Error("item to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeTruthy();
  });

  it('should fail to item a package (id not found, returns false)', async () => {
    const result = await controller.remove(0);
    expect(result).toBeFalsy();
  });
});
