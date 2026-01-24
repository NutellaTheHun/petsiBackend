import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageService } from './inventory-item-package.service';

class TestableInventoryItemPackageService extends InventoryItemPackageService {
  async createEntityForTest(
    dto: CreateInventoryItemPackageDto,
    manager: EntityManager,
  ): Promise<InventoryItemPackage> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemPackageDto,
    entity: InventoryItemPackage,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory Item Package Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let packageService: InventoryItemPackageService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule({
      inventoryItemPackageServiceClass: TestableInventoryItemPackageService,
    });

    dbTestContext = new DatabaseTestContext();

    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );

    await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);

    packageService = module.get(
      InventoryItemPackageService,
    ) as TestableInventoryItemPackageService;

    dataSource = module.get(DataSource);
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
      name: 'testPackageName',
    } as CreateInventoryItemPackageDto;

    const result = await packageService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual('testPackageName');

    testId = result?.id as number;
  });

  it('should update a package', async () => {
    const dto = {
      name: 'update pkg name',
    } as UpdateInventoryItemPackageDto;

    const result = await packageService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual('update pkg name');
  });

  it('should get a package by name', async () => {
    const result = await packageService.findOneByName('update pkg name');

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('update pkg name');
  });

  it('should remove a inventory item package', async () => {
    const removal = await packageService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(packageService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
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

    for (const result of results) {
      expect(testIds.find((id) => result.id)).toBeTruthy();
    }
  });
});
