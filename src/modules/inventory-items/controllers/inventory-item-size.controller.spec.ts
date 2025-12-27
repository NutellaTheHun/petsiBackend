import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import {
  FL_OUNCE,
  GALLON,
  LITER,
  MILLILITER,
  QUART,
} from '../../unit-of-measure/utils/constants';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import {
  BAG_PKG,
  BOX_PKG,
  CAN_PKG,
  CONTAINER_PKG,
  OTHER_PKG,
  PACKAGE_PKG,
} from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemSizeController } from './inventory-item-size.controller';

describe('Inventory Item Size Controller', () => {
  let controller: InventoryItemSizeController;
  let service: InventoryItemSizeService;

  let sizes: InventoryItemSize[] = [];
  let sizeId = 4;

  let packages: InventoryItemPackage[];
  let pkgId = 1;

  let items: InventoryItem[];
  let itemId = 1;

  let units: UnitOfMeasure[];
  let unitId = 1;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemSizeController>(
      InventoryItemSizeController,
    );
    service = module.get<InventoryItemSizeService>(InventoryItemSizeService);

    units = [
      { name: GALLON } as UnitOfMeasure,
      { name: LITER } as UnitOfMeasure,
      { name: MILLILITER } as UnitOfMeasure,
      { name: FL_OUNCE } as UnitOfMeasure,
      { name: QUART } as UnitOfMeasure,
    ];
    units.map((unit) => (unit.id = unitId++));

    packages = [
      { name: BAG_PKG } as InventoryItemPackage,
      { name: PACKAGE_PKG } as InventoryItemPackage,
      { name: BOX_PKG } as InventoryItemPackage,
      { name: OTHER_PKG } as InventoryItemPackage,
      { name: CONTAINER_PKG } as InventoryItemPackage,
      { name: CAN_PKG } as InventoryItemPackage,
    ];
    packages.map((pkg) => (pkg.id = pkgId++));

    items = [
      { name: 'FOOD_A' } as InventoryItem,
      { name: 'DRY_A' } as InventoryItem,
      { name: 'OTHER_A' } as InventoryItem,
      { name: 'FOOD_B' } as InventoryItem,
      { name: 'DRY_B' } as InventoryItem,
    ];
    items.map((pkg) => (pkg.id = itemId++));

    sizes = [
      {
        id: 1,
        measureType: units[0],
        package: packages[0],
        inventoryItem: items[0],
      } as InventoryItemSize,
      {
        id: 2,
        measureType: units[1],
        package: packages[1],
        inventoryItem: items[1],
      } as InventoryItemSize,
      {
        id: 3,
        measureType: units[2],
        package: packages[2],
        inventoryItem: items[2],
      } as InventoryItemSize,
    ];

    jest
      .spyOn(service, 'create')
      .mockImplementation(async (createDto: CreateInventoryItemSizeDto) => {
        const exists = sizes.find(
          (unit) =>
            unit.inventoryItem.id === createDto.inventoryItemId &&
            unit.measureType.id === createDto.measureTypeId &&
            unit.package.id === createDto.packageId,
        );
        if (exists) {
          throw new BadRequestException();
        }

        const item = items.find((i) => i.id === createDto.inventoryItemId);
        const pkg = packages.find((p) => p.id === createDto.packageId);
        const measure = units.find((m) => m.id === createDto.measureTypeId);
        const unit = {
          measureType: measure,
          package: pkg,
          inventoryItem: item,
        } as InventoryItemSize;

        unit.id = sizeId++;
        sizes.push(unit);
        return unit;
      });

    jest
      .spyOn(service, 'findSizesByItemName')
      .mockImplementation(async (name: string, relations?: string[]) => {
        return sizes.filter((unit) => unit.inventoryItem.name == name);
      });

    jest
      .spyOn(service, 'update')
      .mockImplementation(
        async (id: number, updateDto: UpdateInventoryItemSizeDto) => {
          const index = sizes.findIndex((unit) => unit.id === id);
          if (index === -1) throw new BadRequestException();

          if (updateDto.packageId) {
            const pkg = packages.find((p) => p.id === updateDto.packageId);
            if (!pkg) {
              throw new Error('package is null');
            }
            sizes[index].package = pkg;
          }
          if (updateDto.measureTypeId) {
            const unit = units.find((m) => m.id === updateDto.measureTypeId);
            if (!unit) {
              throw new Error('unit is null');
            }
            sizes[index].measureType = unit;
          }

          return sizes[index];
        },
      );

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: sizes });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      const result = sizes.find((unit) => unit.id === id);
      if (!result) {
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = sizes.findIndex((unit) => unit.id === id);
      if (index === -1) return false;

      sizes.splice(index, 1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should fail to create a size', async () => {
    const dto = {
      measureTypeId: 1,
      packageId: 1,
      inventoryItemId: 1,
    } as CreateInventoryItemSizeDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should fail to create a size (already exists)', async () => {
    const dto = {
      measureTypeId: 1,
      packageId: 1,
      inventoryItemId: 1,
    } as CreateInventoryItemSizeDto;

    await expect(controller.create(dto)).rejects.toThrow(Error);
  });

  it('should return all sizes', async () => {
    const results = await controller.findAll();
    expect(results.items.length).toEqual(sizes.length);
  });

  it('should return a size by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });

  it('should fail to return a size (bad id, returns null)', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
  });

  it('should update a size', async () => {
    const results = await service.findSizesByItemName('FOOD_A');
    if (!results) {
      throw new Error('resuts not found');
    }

    const toUpdate = results[0];
    if (!toUpdate) {
      throw new Error('size to update not found');
    }

    const dto = {
      packageId: packages[1].id,
    } as UpdateInventoryItemSizeDto;
    const result = await controller.update(toUpdate.id, dto);

    expect(result).not.toBeNull();
    expect(result?.package.id).toEqual(packages[1].id);
  });

  it('should fail to update a size (doesnt exist)', async () => {
    const toUpdate = await service.findSizesByItemName('FOOD_A');
    if (!toUpdate) {
      throw new Error('unit to update not found');
    }

    const dto = {
      id: toUpdate[0].id,
    } as UpdateInventoryItemSizeDto;

    await expect(controller.update(0, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should remove a size', async () => {
    const results = await service.findSizesByItemName('FOOD_A');
    if (!results) {
      throw new Error('sizes by item name to remove not found');
    }

    const toRemove = results[0];
    if (!toRemove) {
      throw new Error('unit to remove not found');
    }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeUndefined();
  });

  it('should fail to remove a size (id not found, returns false)', async () => {
    await expect(controller.remove(0)).rejects.toThrow(NotFoundException);
  });
});
