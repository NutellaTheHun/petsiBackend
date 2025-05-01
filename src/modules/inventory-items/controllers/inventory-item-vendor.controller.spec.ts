import { TestingModule } from '@nestjs/testing';
import { InventoryItemVendorController } from './inventory-item-vendor.controller';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { VENDOR_A, VENDOR_B, VENDOR_C } from '../utils/constants';

describe('Inventory Item Vendor Controller', () => {
  let controller: InventoryItemVendorController;
  let vendorService: InventoryItemVendorService;

  let vendors: InventoryItemVendor[] = [];
  let items: InventoryItem[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemVendorController>(InventoryItemVendorController);
    vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);

    vendors = [
      { name: VENDOR_A } as InventoryItemVendor,
      { name: VENDOR_B } as InventoryItemVendor,
      { name: VENDOR_C } as InventoryItemVendor,
    ];
    let id = 1;
    vendors.map(vendor => vendor.id = id++);

    items = [
      { id: 1, name: "FOOD_A",  vendor: vendors[0] } as InventoryItem,
      { id: 2, name: "DRY_A",   vendor: vendors[0] } as InventoryItem,
      { id: 3, name: "OTHER_A", vendor: vendors[0] } as InventoryItem,
      { id: 4, name: "FOOD_B",  vendor: vendors[1] } as InventoryItem,
      { id: 5, name: "DRY_B",   vendor: vendors[1] } as InventoryItem,
    ];

    vendors[0].items = [items[0], items[1], items[2]];
    vendors[1].items = [items[3], items[4]];

    jest.spyOn(vendorService, "create").mockImplementation(async (createDto: CreateInventoryItemVendorDto) => {
      const exists = vendors.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      const unit = {
        id: id++,
        name: createDto.name,
      } as InventoryItemVendor;

      vendors.push(unit);
      return unit;
    });

    jest.spyOn(vendorService, "findOneByName").mockImplementation(async (name: string) => {
      return vendors.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(vendorService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemVendorDto) => {
      const index = vendors.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      if(updateDto.name){
        vendors[index].name = updateDto.name;
      }
      if(updateDto.inventoryItemIds){
        const updateItems = [] as InventoryItem[];
        for(id of updateDto.inventoryItemIds){
          let item = items.find(i => i.id === id);
          if(item){ updateItems.push(item); }
        }
        vendors[index].items = updateItems;
      }

      return vendors[index];
    });

    jest.spyOn(vendorService, "findAll").mockResolvedValue( {items: vendors} );

    jest.spyOn(vendorService, "findOne").mockImplementation(async (id: number) => {
      return vendors.find(unit => unit.id === id) || null;
    });

    jest.spyOn(vendorService, "remove").mockImplementation( async (id: number) => {
      const index = vendors.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      vendors.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a vendor', async () => {
    const dto = {
      name: "testVendor",
    } as CreateInventoryItemVendorDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a vendor (already exists)', async () => {
    const dto = {
      name: "testVendor",
    } as CreateInventoryItemVendorDto;

    const result = await controller.create(dto);
    expect(result).toBeNull();
  });

  it('should return all vendors', async () => {
    const results = await controller.findAll();
    expect(results.items.length).toEqual(vendors.length);
  });
  
  it('should return a vendor by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a vendor (bad id, returns null)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });
  
  it('should update a vendor', async () => {
    const toUpdate = await vendorService.findOneByName("testVendor");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const dto = {
      name: "UPDATED_testVendor"
    } as UpdateInventoryItemVendorDto

    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_testVendor")
  });
  
  it('should fail to update a vendor (doesnt exist)', async () => {
    const toUpdate = await vendorService.findOneByName("UPDATED_testVendor");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const result = await controller.update(0, toUpdate);
    expect(result).toBeNull();
  });
  
  it('should remove a vendor', async () => {
    const toRemove = await vendorService.findOneByName("UPDATED_testVendor");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeTruthy();
  });

  it('should fail to remove a vendor (id not found, returns false)', async () => {
    const result = await controller.remove(0);
    expect(result).toBeFalsy();
  });
});