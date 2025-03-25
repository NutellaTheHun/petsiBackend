import { TestingModule } from '@nestjs/testing';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { InventoryItemPackageFactory } from '../factories/inventory-item-package.factory';
import { BOX_PKG } from '../utils/constants';

describe('Inventory Item Package Service', () => {
  let packageService: InventoryItemPackageService;
  let packageFactory: InventoryItemPackageFactory;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    packageFactory = module.get<InventoryItemPackageFactory>(InventoryItemPackageFactory);
  });

  afterAll(async () => {
    const packageQueryBuider = packageService.getQueryBuilder();
    await packageQueryBuider.delete().execute();
  });

  it('should be defined', () => {
    expect(packageService).toBeDefined();
  });

  it('should create a inventory item package', async () => {
    const createPkg = packageFactory.createDtoInstance({ name: "testPackageName"});
    
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
    const result = await packageService.update(testId, 
      packageFactory.createDtoInstance({
        name: toUpdate.name,
      })
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
    const defaultPackages = await packageFactory.getTestingPackages();
    if(!defaultPackages){ throw Error('default packages is null'); }

    for(const pkg of defaultPackages){
      await packageService.create(
        packageFactory.createDtoInstance({ name: pkg.name })
      )
    }

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