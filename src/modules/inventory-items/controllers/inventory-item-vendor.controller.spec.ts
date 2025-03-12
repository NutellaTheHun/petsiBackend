import { TestingModule } from '@nestjs/testing';
import { InventoryItemVendorController } from './inventory-item-vendor.controller';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';

describe('Inventory Item Vendor Controller', () => {
  let controller: InventoryItemVendorController;
  let service: InventoryItemVendorService;
  let factory: InventoryItemVendorFactory;

  beforeEach(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemVendorController>(InventoryItemVendorController);
    service = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    factory = module.get<InventoryItemVendorFactory>(InventoryItemVendorFactory);

    let vendors = factory.getTestingVendors();
    let id = 1;
    vendors.map(vendor => vendor.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (createDto: CreateInventoryItemVendorDto) => {
      const exists = vendors.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      const unit = factory.createDtoToEntity(createDto);
      unit.id = id++;
      vendors.push(unit);
      return unit;
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return vendors.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(service, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemVendorDto) => {
      const index = vendors.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const updated = factory.updateDtoToEntity(updateDto);
      updated.id = id++;
      vendors[index] = updated;

      return updated;
    });

    jest.spyOn(service, "findAll").mockResolvedValue(vendors);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      return vendors.find(unit => unit.id === id) || null;
    });

    jest.spyOn(service, "remove").mockImplementation( async (id: number) => {
      const index = vendors.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      vendors.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});