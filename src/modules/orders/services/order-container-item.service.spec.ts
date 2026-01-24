import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemService } from './order-container-item.service';

class TestableOrderContainerItemService extends OrderContainerItemService {
  async createEntityForTest(
    dto: CreateOrderContainerItemDto,
    manager: EntityManager,
  ): Promise<OrderContainerItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateOrderContainerItemDto,
    entity: OrderContainerItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('order container item service', () => {
  let service: OrderContainerItemService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let menuItemRepo: Repository<MenuItem>;
  let orderItemRepo: Repository<OrderMenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule({
      orderContainerItemServiceClass: TestableOrderContainerItemService,
    });
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);

    service = module.get(
      OrderContainerItemService,
    ) as TestableOrderContainerItemService;

    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test createEntity()
  it('should create container item', async () => {});

  // test updateEntity()
  it('should update container item', async () => {});

  // test findAll()
  it('should find all container items', async () => {});

  // test findAll() with search by name
  it('should find all container items with search by name', async () => {});

  // test findAll() with filter by category
  it('should find all container items with filter by category', async () => {});

  // test findAll() with sort by name
  it('should find all container items with sort by name', async () => {});

  // test findAll() with sort by category
  it('should find all container items with sort by category', async () => {});

  // test findOne()
  it('should find one container item', async () => {});

  // test findOne() with relations
  it('should find one container item with relations', async () => {});

  // test remove()
  it('should remove container item', async () => {});
});
