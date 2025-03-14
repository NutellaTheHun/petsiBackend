import { TestingModule } from "@nestjs/testing";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { InventoryItemSizeFactory } from "../factories/inventory-item-size.factory";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemSizeController } from "./inventory-item-size.controller";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { UnitOfMeasureFactory } from "../../unit-of-measure/factories/unit-of-measure.factory";
import { InventoryItemFactory } from "../factories/inventory-item.factory";
import { FL_OUNCE, GALLON, LITER, MILLILITER, QUART } from "../../unit-of-measure/utils/constants";
import { InventoryItemPackageFactory } from "../factories/inventory-item-package.factory";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItem } from "../entities/inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";

describe('Inventory Item Size Controller', () => {
  let controller: InventoryItemSizeController;
  let service: InventoryItemSizeService;
  let sizeFactory: InventoryItemSizeFactory;

  let itemFactory: InventoryItemFactory;
  let packageFactory: InventoryItemPackageFactory
  let unitFactory: UnitOfMeasureFactory;
  
  let sizes: InventoryItemSize[] = [];
  let sizeId = 1;

  let packages: InventoryItemPackage[];
  let items: InventoryItem[];
  let units: UnitOfMeasure[];
  

  beforeEach(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemSizeController>(InventoryItemSizeController);
    service = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    sizeFactory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);

    itemFactory = module.get<InventoryItemFactory>(InventoryItemFactory);
    packageFactory = module.get<InventoryItemPackageFactory>(InventoryItemPackageFactory);
    unitFactory = module.get<UnitOfMeasureFactory>(UnitOfMeasureFactory);

    units = [
      unitFactory.createEntityInstance({
          name: GALLON, 
          id: 1
      }),
      unitFactory.createEntityInstance({
          name: LITER, 
          id: 2,
      }),
      unitFactory.createEntityInstance({
          name: MILLILITER, 
          id: 3,
      }),
      unitFactory.createEntityInstance({
          name: FL_OUNCE, 
          id: 4,
      }),
      unitFactory.createEntityInstance({
          name: QUART, 
          id: 5,
      })
    ];

    packages = packageFactory.getTestingPackages();
    let pkgId = 1;
    packages.map(pkg => pkg.id = pkgId++);

    items = [
      itemFactory.createEntityInstance({ name: "FOOD_A"  }),
      itemFactory.createEntityInstance({ name: "DRY_A"   }),
      itemFactory.createEntityInstance({ name: "OTHER_A" }),
      itemFactory.createEntityInstance({ name: "FOOD_B"  }),
      itemFactory.createEntityInstance({ name: "DRY_B"   }),
    ];
    let itemId = 1;
    items.map(pkg => pkg.id = itemId++);

    jest.spyOn(service, "create").mockImplementation(async (createDto: CreateInventoryItemSizeDto) => {
      const exists = sizes.find(unit => 
        unit.item.id === createDto.inventoryItemId &&
        unit.measureUnit.id === createDto.unitOfMeasureId &&
        unit.packageType.id === createDto.inventoryPackageTypeId
      );
      if(exists){ return null; }

      const item = items.find(i => i.id === createDto.inventoryItemId);
      const pkg = items.find(p => p.id === createDto.inventoryPackageTypeId);
      const measure = items.find(m => m.id === createDto.unitOfMeasureId);
      const unit = { measureUnit: measure, packageType: pkg, item: item } as InventoryItemSize;

      unit.id = sizeId++;
      sizes.push(unit);
      return unit;
    });

    jest.spyOn(service, "findSizesByItemName").mockImplementation(async (name: string, relations?: string[]) => {
      return sizes.filter(unit => unit.item.name == name);
    });
    
    jest.spyOn(service, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemSizeDto) => {
      const index = sizes.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const updated = sizeFactory.updateDtoToEntity(updateDto);
      updated.id = id++;
      sizes[index] = updated;

      return updated;
    });

    jest.spyOn(service, "findAll").mockResolvedValue(sizes);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      return sizes.find(unit => unit.id === id) || null;
    });

    jest.spyOn(service, "remove").mockImplementation( async (id: number) => {
      const index = sizes.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      sizes.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a size', async () => {
    const sizeDto = sizeFactory.createDtoInstance({
      unitOfMeasureId: 1,
      inventoryPackageTypeId: 1,
      inventoryItemId: 1,
    })
    const result = await controller.create(sizeDto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a size (already exists)', async () => {
    const sizeDto = sizeFactory.createDtoInstance({
      unitOfMeasureId: 1,
      inventoryPackageTypeId: 1,
      inventoryItemId: 1,
    })
    const result = await controller.create(sizeDto);
    expect(result).toBeNull();
  });

  it('should return all sizes', async () => {
    const results = await controller.findAll();
    expect(results.length).toEqual(sizes.length);
  });
  
  it('should return a size by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a size (bad id, returns null)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });
  
  it('should update a size', async () => {
    const results = await service.findSizesByItemName("FOOD_A");
    if(!results){ throw new Error("resuts not found"); }

    const toUpdate = results[0];
    if(!toUpdate){ throw new Error("size to update not found"); }

    toUpdate.packageType = packages[1];
    const result = await controller.update(toUpdate.id, toUpdate);

    expect(result).not.toBeNull();
    expect(result?.packageType.id).toEqual(packages[1].id);
  });
  
  it('should fail to update a size (doesnt exist)', async () => {
    const toUpdate = await service.findSizesByItemName("FOOD_A");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const result = await controller.update(0, toUpdate);
    expect(result).toBeNull();
  });
  
  it('should remove a size', async () => {
    const results = await service.findSizesByItemName("FOOD_A");
    if(!results){ throw new Error("sizes by item name to remove not found"); }

    const toRemove = results[0];
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeTruthy();
  });

  it('should fail to remove a size (id not found, returns false)', async () => {
    const result = await controller.remove(0);
    expect(result).toBeFalsy();
  });
});