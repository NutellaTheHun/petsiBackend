import { TestingModule } from "@nestjs/testing";
import { InventoryItemPackageFactory } from "../factories/inventory-item-package.factory";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemPackageController } from "./inventory-item-package.controller";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";

describe('Inventory Item Packages Controller', () => {
  let controller: InventoryItemPackageController;
  let service: InventoryItemPackageService;
  let factory: InventoryItemPackageFactory;

  let packages: InventoryItemPackage[]
  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemPackageController>(InventoryItemPackageController);
    service = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    factory = module.get<InventoryItemPackageFactory>(InventoryItemPackageFactory);

    packages = factory.getTestingPackages();
    let id = 1;
    packages.map(pkg => pkg.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (createDto: CreateInventoryItemPackageDto) => {
      const exists = packages.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      const unit = factory.createDtoToEntity(createDto);
      unit.id = id++;
      packages.push(unit);
      return unit;
    });
        
    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return packages.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(service, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemPackageDto) => {
      const index = packages.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const updated = factory.updateDtoToEntity(updateDto);
      updated.id = id++;
      packages[index] = updated;

      return updated;
    });

    jest.spyOn(service, "findAll").mockResolvedValue(packages);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      return packages.find(unit => unit.id === id) || null;
    });

    jest.spyOn(service, "remove").mockImplementation( async (id: number) => {
      const index = packages.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      packages.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a package', async () => {
    const unitDto = factory.createDtoInstance({
      name: "testpackage",
    })
    const result = await controller.create(unitDto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a package (already exists)', async () => {
    const unitDto = factory.createDtoInstance({
      name: "testpackage",
    })
    const result = await controller.create(unitDto);
    expect(result).toBeNull();
  });

  it('should return all packages', async () => {
    const results = await controller.findAll();
    expect(results.length).toEqual(packages.length);
  });
  
  it('should return a package by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a package (bad id, returns null)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });
  
  it('should update a package', async () => {
    const toUpdate = await service.findOneByName("testpackage");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    toUpdate.name = "UPDATED_testpackage";
    const result = await controller.update(toUpdate.id, toUpdate);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_testpackage")
  });
  
  it('should fail to update a package (doesnt exist)', async () => {
    const toUpdate = await service.findOneByName("UPDATED_testpackage");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const result = await controller.update(0, toUpdate);
    expect(result).toBeNull();
  });
  
  it('should remove a package', async () => {
    const toRemove = await service.findOneByName("UPDATED_testpackage");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeTruthy();
  });

  it('should fail to remove a package (id not found, returns false)', async () => {
    const result = await controller.remove(0);
    expect(result).toBeFalsy();
  });
  
});