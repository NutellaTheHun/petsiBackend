import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';

class TestableInventoryItemCategoryService extends InventoryItemCategoryService {
  async createEntityForTest(
    dto: CreateInventoryItemCategoryDto,
    manager: EntityManager,
  ): Promise<InventoryItemCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemCategoryDto,
    entity: InventoryItemCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory Item Category Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let service: InventoryItemCategoryService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule({
      inventoryItemCategoryServiceClass: TestableInventoryItemCategoryService,
    });
    dbTestContext = new DatabaseTestContext();

    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );

    service = module.get<InventoryItemCategoryService>(
      InventoryItemCategoryService,
    ) as TestableInventoryItemCategoryService;

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    const categoryQueryBuilder = service.getQueryBuilder();
    await categoryQueryBuilder.delete().execute();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test createEntity()
  it('should create category', async () => {});

  // test updateEntity()
  it('should update category', async () => {});

  // test findAll()
  it('should find all categories', async () => {});

  // test findall() with sort by name
  it('should find all categories with sort by name', async () => {});

  // test findOne()
  it('should find one category', async () => {});

  // test findOne() with relations
  it('should find one category with relations', async () => {});

  // test remove()
  it('should remove category', async () => {});
});
