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

  // test createEntity()
  it('should create package', async () => {});

  // test updateEntity()
  it('should update package', async () => {});

  // test findAll()
  it('should find all packages', async () => {});

  // test findall() with sort by name
  it('should find all packages with sort by name', async () => {});

  // test findOne()
  it('should find one package', async () => {});

  // test remove()
  it('should remove package', async () => {});
});
