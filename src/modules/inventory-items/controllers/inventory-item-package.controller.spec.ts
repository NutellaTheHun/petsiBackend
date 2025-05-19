import { TestingModule } from "@nestjs/testing";
import { CreateInventoryItemPackageDto } from "../dto/inventory-item-package/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/inventory-item-package/update-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { BAG_PKG, BOX_PKG, CAN_PKG, CONTAINER_PKG, OTHER_PKG, PACKAGE_PKG } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemPackageController } from "./inventory-item-package.controller";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AppHttpException } from "../../../util/exceptions/AppHttpException";

describe('Inventory Item Packages Controller', () => {
  let controller: InventoryItemPackageController;
  let service: InventoryItemPackageService;

  let packages: InventoryItemPackage[]
  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemPackageController>(InventoryItemPackageController);
    service = module.get<InventoryItemPackageService>(InventoryItemPackageService);
 
    packages = [
      { packageName: BAG_PKG } as InventoryItemPackage,
      { packageName: PACKAGE_PKG } as InventoryItemPackage,
      { packageName: BOX_PKG } as InventoryItemPackage,
      { packageName: OTHER_PKG } as InventoryItemPackage,
      { packageName: CONTAINER_PKG } as InventoryItemPackage,
      { packageName: CAN_PKG } as InventoryItemPackage,
    ];
    let id = 1;
    packages.map(pkg => pkg.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (createDto: CreateInventoryItemPackageDto) => {
      const exists = packages.find(unit => unit.packageName === createDto.packageName);
      if(exists){ throw new BadRequestException(); }

      const unit = {
        id: id++,
        packageName: createDto.packageName,
      } as InventoryItemPackage;

      packages.push(unit);
      return unit;
    });
        
    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return packages.find(unit => unit.packageName === name) || null;
    });
    
    jest.spyOn(service, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemPackageDto) => {
      const index = packages.findIndex(unit => unit.id === id);
      if (index === -1) throw new NotFoundException();

      if(updateDto.packageName){
        packages[index].packageName = updateDto.packageName;
      }

      return packages[index];
    });

    jest.spyOn(service, "findAll").mockResolvedValue( {items: packages} );

    jest.spyOn(service, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      const result = packages.find(unit => unit.id === id)
      if(!result){
        throw new Error();
      }
      return result;
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
    const dto = {
      packageName: "testpackage",
    } as CreateInventoryItemPackageDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a package (already exists)', async () => {
    const dto = {
      packageName: "testpackage",
    } as CreateInventoryItemPackageDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should return all packages', async () => {
    const results = await controller.findAll();
    expect(results.items.length).toEqual(packages.length);
  });
  
  it('should return a package by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a package (bad id, returns null)', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
  });
  
  it('should update a package', async () => {
    const toUpdate = await service.findOneByName("testpackage");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    toUpdate.packageName = "UPDATED_testpackage";
    const dto = {
      packageName: "UPDATED_testpackage"
    } as UpdateInventoryItemPackageDto;
    
    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.packageName).toEqual("UPDATED_testpackage")
  });
  
  it('should fail to update a package (doesnt exist)', async () => {
    const toUpdate = await service.findOneByName("UPDATED_testpackage");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    await expect(controller.update(0, toUpdate)).rejects.toThrow(NotFoundException);
  });
  
  it('should remove a package', async () => {
    const toRemove = await service.findOneByName("UPDATED_testpackage");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeUndefined();
  });

  it('should fail to remove a package (id not found, returns false)', async () => {
    await expect(controller.remove(0)).rejects.toThrow(NotFoundException)
  });
});