import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { InventoryItemService } from '../services/inventory-item.service';
import { DRY_A, DRY_B, DRY_C, FOOD_A, FOOD_B, FOOD_C, OTHER_A, OTHER_B, OTHER_C } from "../utils/constants";
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemController } from './inventory-item.controller';


describe('Inventory Item Controller', () => {
  let controller: InventoryItemController;
  let itemService: InventoryItemService;
  let itemFactory: InventoryItemFactory;

  let categoryFactory: InventoryItemCategoryFactory;
  let vendorFactory: InventoryItemVendorFactory

  let items: InventoryItem[] = [];
  let categories: InventoryItemCategory[];
  let vendors: InventoryItemVendor[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemController>(InventoryItemController);
    itemService = module.get<InventoryItemService>(InventoryItemService);
    itemFactory = module.get<InventoryItemFactory>(InventoryItemFactory);

    categoryFactory = module.get<InventoryItemCategoryFactory>(InventoryItemCategoryFactory);
    vendorFactory = module.get<InventoryItemVendorFactory>(InventoryItemVendorFactory);

    // vendor
    vendors = vendorFactory.getTestingVendors();
    let VendId = 1;
    vendors.map(vendor => vendor.id = VendId++);

    // category
    categories = await categoryFactory.getTestingItemCategories();
    let categoryId = 1;
    categories.map(category => category.id = categoryId++);

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
    let id = 1;
    items.map(item => item.id = id++);

    jest.spyOn(itemService, "create").mockImplementation(async (createDto: CreateInventoryItemDto) => {
      const exists = items.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      
      const category = categories.find(c => c.id === createDto.inventoryItemCategoryId);
      const vendor = vendors.find(v => v.id === createDto.vendorId);
      const unit = { id: 0, name: createDto.name, vendor, category } as InventoryItem;
      unit.id = id++;
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

    jest.spyOn(itemService, "findAll").mockResolvedValue(items);

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
    const unitDto = itemFactory.createDtoInstance({
      name: "testItem",
      inventoryItemCategoryId: 1,
      vendorId: 1,
    });
    const result = await controller.create(unitDto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a item (already exists)', async () => {
    const unitDto = itemFactory.createDtoInstance({
      name: "testItem",
      inventoryItemCategoryId: 1,
      vendorId: 1,
    })
    const result = await controller.create(unitDto);
    expect(result).toBeNull();
  });

  it('should return all items', async () => {
    const results = await controller.findAll();
    expect(results.length).toEqual(items.length);
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

    toUpdate.name = "UPDATED_testItem";
    const result = await controller.update(toUpdate.id, toUpdate);
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
