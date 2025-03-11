import { TestingModule } from "@nestjs/testing";
import { InventoryItemPackageFactory } from "../factories/inventory-item-package.factory";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemPackageController } from "./inventory-item-packages.contoller";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";

describe('Inventory Item Package Controller', () => {
  let controller: InventoryItemPackageController;
  let service: InventoryItemPackageService;
  let factory: InventoryItemPackageFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemPackageController>(InventoryItemPackageController);
    service = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    factory = module.get<InventoryItemPackageFactory>(InventoryItemPackageFactory);

    let packages = factory.getTestingPackages();
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
});