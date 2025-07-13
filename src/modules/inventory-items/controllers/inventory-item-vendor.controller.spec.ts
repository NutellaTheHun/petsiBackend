import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { VENDOR_A, VENDOR_B, VENDOR_C } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemVendorController } from './inventory-item-vendor.controller';

describe('Inventory Item Vendor Controller', () => {
  let controller: InventoryItemVendorController;
  let vendorService: InventoryItemVendorService;

  let vendors: InventoryItemVendor[] = [];
  let items: InventoryItem[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemVendorController>(
      InventoryItemVendorController,
    );
    vendorService = module.get<InventoryItemVendorService>(
      InventoryItemVendorService,
    );

    vendors = [
      { vendorName: VENDOR_A } as InventoryItemVendor,
      { vendorName: VENDOR_B } as InventoryItemVendor,
      { vendorName: VENDOR_C } as InventoryItemVendor,
    ];
    let id = 1;
    vendors.map((vendor) => (vendor.id = id++));

    items = [
      { id: 1, itemName: 'FOOD_A', vendor: vendors[0] } as InventoryItem,
      { id: 2, itemName: 'DRY_A', vendor: vendors[0] } as InventoryItem,
      { id: 3, itemName: 'OTHER_A', vendor: vendors[0] } as InventoryItem,
      { id: 4, itemName: 'FOOD_B', vendor: vendors[1] } as InventoryItem,
      { id: 5, itemName: 'DRY_B', vendor: vendors[1] } as InventoryItem,
    ];

    vendors[0].vendorItems = [items[0], items[1], items[2]];
    vendors[1].vendorItems = [items[3], items[4]];

    jest
      .spyOn(vendorService, 'create')
      .mockImplementation(async (createDto: CreateInventoryItemVendorDto) => {
        const exists = vendors.find(
          (unit) => unit.vendorName === createDto.vendorName,
        );
        if (exists) {
          throw new BadRequestException();
        }

        const unit = {
          id: id++,
          vendorName: createDto.vendorName,
        } as InventoryItemVendor;

        vendors.push(unit);
        return unit;
      });

    jest
      .spyOn(vendorService, 'findOneByName')
      .mockImplementation(async (name: string) => {
        return vendors.find((unit) => unit.vendorName === name) || null;
      });

    jest
      .spyOn(vendorService, 'update')
      .mockImplementation(
        async (id: number, updateDto: UpdateInventoryItemVendorDto) => {
          const index = vendors.findIndex((unit) => unit.id === id);
          if (index === -1) throw new BadRequestException();

          if (updateDto.vendorName) {
            vendors[index].vendorName = updateDto.vendorName;
          }

          return vendors[index];
        },
      );

    jest.spyOn(vendorService, 'findAll').mockResolvedValue({ items: vendors });

    jest
      .spyOn(vendorService, 'findOne')
      .mockImplementation(async (id?: number) => {
        if (!id) {
          throw new Error();
        }
        const result = vendors.find((unit) => unit.id === id);
        if (!result) {
          throw new Error();
        }
        return result;
      });

    jest
      .spyOn(vendorService, 'remove')
      .mockImplementation(async (id: number) => {
        const index = vendors.findIndex((unit) => unit.id === id);
        if (index === -1) {
          throw new NotFoundException();
        }

        vendors.splice(index, 1);

        return true;
      });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a vendor', async () => {
    const dto = {
      vendorName: 'testVendor',
    } as CreateInventoryItemVendorDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });

  it('should fail to create a vendor (already exists)', async () => {
    const dto = {
      vendorName: 'testVendor',
    } as CreateInventoryItemVendorDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
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
    await expect(controller.findOne(0)).rejects.toThrow(Error);
  });

  it('should update a vendor', async () => {
    const toUpdate = await vendorService.findOneByName('testVendor');
    if (!toUpdate) {
      throw new Error('unit to update not found');
    }

    const dto = {
      vendorName: 'UPDATED_testVendor',
    } as UpdateInventoryItemVendorDto;

    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.vendorName).toEqual('UPDATED_testVendor');
  });

  it('should fail to update a vendor (doesnt exist)', async () => {
    const toUpdate = await vendorService.findOneByName('UPDATED_testVendor');
    if (!toUpdate) {
      throw new Error('unit to update not found');
    }

    await expect(controller.update(0, toUpdate)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should remove a vendor', async () => {
    const toRemove = await vendorService.findOneByName('UPDATED_testVendor');
    if (!toRemove) {
      throw new Error('unit to remove not found');
    }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeUndefined();
  });

  it('should fail to remove a vendor (id not found)', async () => {
    await expect(controller.remove(0)).rejects.toThrow(NotFoundException);
  });
});
