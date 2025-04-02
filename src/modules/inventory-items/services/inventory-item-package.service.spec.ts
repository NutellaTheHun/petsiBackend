import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemPackageDto } from '../dto/create-inventory-item-package.dto';
import { BOX_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { UpdateInventoryItemPackageDto } from '../dto/update-inventory-item-package.dto';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';

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
    const createPkg = { name: "testPackageName"} as CreateInventoryItemPackageDto;
    
    const result = await packageService.create(createPkg);

    // for future testing
    testId = result?.id as number;

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should update a inventory item package', async () => {
    const updatedName = "UPDATED NAME"
    const toUpdate = await packageService.findOne(testId);
    if(!toUpdate) { throw new Error('toUpdate is null'); }

    toUpdate.name = updatedName;
    const result = await packageService.update(
      testId, 
      { name: toUpdate.name, } as UpdateInventoryItemPackageDto
    );

    expect(result?.name).toEqual(updatedName);
  });

  it('should remove a inventory item package', async () => {
    const removal = await packageService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await packageService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should insert default packages and get all inventory item packages', async () => {
    const defaultPackages = await testingUtil.getTestInventoryItemPackageEntities(dbTestContext);

    const results = await packageService.findAll();

    // for future testing
    testIds = [results[0].id, results[1].id, results[2].id];

    expect(results.length).toEqual(defaultPackages.length);
  });

  it('should get a inventory item package by name', async () => {
    const result = await packageService.findOneByName(BOX_PKG);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual(BOX_PKG);
  });

  it('should get inventory item packages from a list of ids', async () => {
    const results = await packageService.findEntitiesById(testIds);

    expect(results.length).toEqual(testIds.length);

    for(const result of results){
      expect(testIds.find(id => result.id)).toBeTruthy();
    }
  });
});