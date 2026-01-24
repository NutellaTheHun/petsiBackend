import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryService } from './order-category.service';

class TestableOrderCategoryService extends OrderCategoryService {
  async createEntityForTest(
    dto: CreateOrderCategoryDto,
    manager: EntityManager,
  ): Promise<OrderCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateOrderCategoryDto,
    entity: OrderCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('order category service', () => {
  let service: OrderCategoryService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule({
      orderCategoryServiceClass: TestableOrderCategoryService,
    });
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initOrderCategoryTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);
    service = module.get(OrderCategoryService) as TestableOrderCategoryService;
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
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

  // test findAll)() with sortByName
  it('should find all categories with sort by name', async () => {});

  // test findOne()
  it('should find one category', async () => {});

  // test findOne() with relations
  it('should find one category with relations', async () => {});

  // test remove()
  it('should remove category', async () => {});
});
