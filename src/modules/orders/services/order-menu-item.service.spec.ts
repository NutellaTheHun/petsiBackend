import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemService } from './order-menu-item.service';

class TestableOrderMenuItemService extends OrderMenuItemService {
  async createEntityForTest(
    dto: CreateOrderMenuItemDto,
    manager: EntityManager,
  ): Promise<OrderMenuItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateOrderMenuItemDto,
    entity: OrderMenuItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('order menu item service', () => {
  let orderItemService: OrderMenuItemService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let orderRepo: Repository<Order>;
  let containerItemRepo: Repository<OrderContainerItem>;
  let menuItemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule({
      orderMenuItemServiceClass: TestableOrderMenuItemService,
    });
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);

    orderItemService = module.get(
      OrderMenuItemService,
    ) as TestableOrderMenuItemService;
    orderRepo = module.get(getRepositoryToken(Order));
    containerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(orderItemService).toBeDefined();
  });

  // test createEntity()
  it('should create order menu item', async () => {});

  // test createEntity() with NestedCreateOrderContainerItemDtos
  it('should create order menu item with NestedCreateOrderContainerItemDtos', async () => {});

  // test updateEntity()
  it('should update order menu item', async () => {});

  // test updateEntity() with NestedUpdateOrderContainerItemDto and NestedCreateOrderContainerItemDto
  it('should update order menu item whos menuItem is of type container with NestedUpdateOrderContainerItemDto and NestedCreateOrderContainerItemDto', async () => {});

  // test findAll()
  it('should find all order menu items', async () => {});

  // test findAll() sortBy quantity
  it('should find all order menu items with sortBy quantity', async () => {});

  // test findAll() sortBy menuItem name
  it('should find all order menu items with sortBy menuItem name', async () => {});

  // test findOne()
  it('should find one order menu item', async () => {});

  // test findOne() with relations
  it('should find one order menu item with relations', async () => {});

  // test remove()
  it('should remove order menu item', async () => {});
});
