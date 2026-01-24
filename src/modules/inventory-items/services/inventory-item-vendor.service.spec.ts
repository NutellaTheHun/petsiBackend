import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorService } from './inventory-item-vendor.service';

class TestableInventoryItemVendorService extends InventoryItemVendorService {
  async createEntityForTest(
    dto: CreateInventoryItemVendorDto,
    manager: EntityManager,
  ): Promise<InventoryItemVendor> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemVendorDto,
    entity: InventoryItemVendor,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory Item Vendor Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let vendorService: InventoryItemVendorService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule({
      inventoryItemVendorServiceClass: TestableInventoryItemVendorService,
    });

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);

    vendorService = module.get(
      InventoryItemVendorService,
    ) as TestableInventoryItemVendorService;

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(vendorService).toBeDefined();
  });

  // test createEntity()
  it('should create vendor', async () => {});

  // test updateEntity()
  it('should update vendor', async () => {});

  // test findAll()
  it('should find all vendors', async () => {});

  // test findall() with sort by name
  it('should find all vendors with sort by name', async () => {});

  // test findOne()
  it('should find one vendor', async () => {});

  // test findOne() with relations
  it('should find one vendor with relations', async () => {});

  // test remove()
  it('should remove vendor', async () => {});
});
