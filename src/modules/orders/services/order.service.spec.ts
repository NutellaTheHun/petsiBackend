import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderService } from './order.service';

class TestableOrderService extends OrderService {
  async createEntityForTest(
    dto: CreateOrderDto,
    manager: EntityManager,
  ): Promise<Order> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateOrderDto,
    entity: Order,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('order service', () => {
  let orderService: OrderService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let categoryRepo: Repository<OrderCategory>;
  let orderItemRepo: Repository<OrderMenuItem>;

  let menuItemRepo: Repository<MenuItem>;
  let menuItemTestUtil: MenuItemTestingUtil;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule({
      orderServiceClass: TestableOrderService,
    });

    dbTestContext = new DatabaseTestContext();

    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderTestDatabase(dbTestContext);

    orderService = module.get(OrderService) as TestableOrderService;
    categoryRepo = module.get(getRepositoryToken(OrderCategory));
    orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  // test createEntity() with NestedCreateOrderMenuItemDto
  it('should create order with NestedCreateOrderMenuItemDto', async () => {});

  // test creatEntity() with NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos
  it('should create order with NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos', async () => {});

  // test updateEntity()
  it('should update order', async () => {});

  // test updateEntity() with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto
  it('should update order with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto', async () => {});

  // test updateEntity() with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos
  it('should update order with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos', async () => {});

  // test findAll()
  it('should find all orders', async () => {});

  // test findAll() with search by recipient
  it('should find all orders with search by recipient', async () => {});

  // test findAll() with search by menuItem name
  it('should find all orders with search by menuItem name', async () => {});

  // test findAll() with filter by category
  it('should find all orders with filter by category', async () => {});

  // test findAll() with filter by isFrozen
  it('should find all orders with filter by isFrozen', async () => {});

  // test findAll() with filter by fulfillmentType
  it('should find all orders with filter by fulfillmentType', async () => {});

  // test findAll() by applyDate with startDate and endDate
  it('should find all orders by applyDate with startDate and endDate', async () => {});

  // test findAll() sortBy category
  it('should find all orders with sortBy category', async () => {});

  // test findAll() sortBy fulfillmentDate
  it('should find all orders with sortBy fulfillmentDate', async () => {});

  // test findAll() sortBy createdAt
  it('should find all orders with sortBy createdAt', async () => {});

  // test findOne()
  it('should find one order', async () => {});

  // test findOne() with relations
  it('should find one order with relations', async () => {});

  // test remove()
  it('should remove order', async () => {});
});
