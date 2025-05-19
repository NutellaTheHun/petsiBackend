import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';

describe('Inventory Item Package Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let packageService: InventoryItemPackageService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);

    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
  });

  afterAll(async () => {
    const packageQueryBuider = packageService.getQueryBuilder();
    await packageQueryBuider.delete().execute();
  });

  it('should be defined', () => {
    expect(packageService).toBeDefined();
  });

  it('should create a inventory item package', async () => {
    const dto = { 
      packageName: "testPackageName"
    } as CreateInventoryItemPackageDto;
    
    const result = await packageService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.packageName).toEqual("testPackageName");

    testId = result?.id as number;
  });

  it('should update a package', async () => {
    const dto = {
      packageName: "update pkg name"
    } as UpdateInventoryItemPackageDto;

    const result = await packageService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.packageName).toEqual("update pkg name");
  });

  it('should get a package by name', async () => {
    const result = await packageService.findOneByName("update pkg name");

    expect(result).not.toBeNull();
    expect(result?.packageName).toEqual("update pkg name");
  });

  it('should remove a inventory item package', async () => {
    const removal = await packageService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(packageService.findOne(testId)).rejects.toThrow(NotFoundException);
  });

  it('should fail to remove item package(not found)', async () => {
    const removal = await packageService.remove(testId);
    expect(removal).toBeFalsy();
  });

  it('should insert default packages and get all inventory item packages', async () => {
    const results = await packageService.findAll();

    expect(results.items.length).toBeGreaterThan(3);

    // for future testing
    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  it('should get inventory item packages from a list of ids', async () => {
    const results = await packageService.findEntitiesById(testIds);

    expect(results.length).toEqual(testIds.length);

    for(const result of results){
      expect(testIds.find(id => result.id)).toBeTruthy();
    }
  });
});