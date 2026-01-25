import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_f } from '../../menu-items/utils/constants';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { TYPE_A } from '../utils/constants';
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
  let orderService: TestableOrderService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let orderRepo: Repository<Order>;
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
    orderRepo = module.get(getRepositoryToken(Order));
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
  it('should create order with NestedCreateOrderMenuItemDto', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
    if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

    const dto: CreateOrderDto = {
      recipient: 'Test Recipient',
      fulfillmentDate: new Date('2026-02-01'),
      fulfillmentType: 'pickup',
      categoryId: cat.id,
      orderedItems: [
        {
          createId: 'o1',
          menuItemId: mi.id,
          sizeId: mi.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      const result = await orderService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.recipient).toEqual(dto.recipient);
      expect(result.orderedItems).toBeDefined();
      expect(Array.isArray(result.orderedItems)).toBe(true);
    });
  });

  // test createEntity() with NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos
  it('should create order with NestedCreateOrderMenuItemDto with NestedCreateOrderContainerItemDtos', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    const container = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: [
        'sizes',
        'containerMenuItems',
        'containerMenuItems.containedMenuItem',
        'containerMenuItems.containedItemSize',
      ],
    });
    if (
      !cat ||
      !container?.sizes?.length ||
      !container.containerMenuItems?.length
    )
      throw new Error('fixtures not found');

    const c0 = container.containerMenuItems[0];
    const dto: CreateOrderDto = {
      recipient: 'Container Order',
      fulfillmentDate: new Date('2026-02-02'),
      fulfillmentType: 'delivery',
      categoryId: cat.id,
      orderedItems: [
        {
          createId: 'o2',
          menuItemId: container.id,
          sizeId: container.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c1',
              containedMenuItemId: c0.containedMenuItem.id,
              containedItemSizeId: c0.containedItemSize.id,
              quantity: 4,
            },
          ],
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      const result = await orderService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      const oi = result.orderedItems?.[0];
      expect(oi?.containerOrderMenuItems).toBeDefined();
      expect(Array.isArray(oi?.containerOrderMenuItems)).toBe(true);
      expect(oi?.containerOrderMenuItems?.length ?? 0).toBeGreaterThan(0);
    });
  });

  // test updateEntity()
  it('should update order', async () => {
    const [o] = await orderRepo.find({ take: 1 });
    if (!o) throw new Error('order not found');

    const dto: UpdateOrderDto = { recipient: 'Updated Recipient' };

    await dataSource.transaction(async (manager) => {
      await orderService.updateEntityForTest(dto, o, manager);
    });

    const result = await orderRepo.findOne({ where: { id: o.id } });
    if (!result) throw new Error('result not found');
    expect(result.recipient).toEqual(dto.recipient);
  });

  // test updateEntity() with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto
  it('should update order with NestedUpdateOrderMenuItemDto and NestedCreateOrderMenuItemDto', async () => {
    const order = await orderRepo.findOne({
      where: {},
      relations: ['orderedItems', 'orderedItems.menuItem', 'orderedItems.size'],
    });
    if (!order?.orderedItems?.length)
      throw new Error('order with orderedItems not found');

    const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
    if (!mi?.sizes?.length) throw new Error('menu item not found');

    const existing = order.orderedItems[0];
    const dto: UpdateOrderDto = {
      orderedItems: [
        { id: existing.id, quantity: 5 },
        {
          createId: 'n1',
          menuItemId: mi.id,
          sizeId: mi.sizes[0].id,
          quantity: 1,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      await orderService.updateEntityForTest(dto, order, manager);
    });

    const reloaded = await orderRepo.findOne({
      where: { id: order.id },
      relations: ['orderedItems'],
    });
    if (!reloaded) throw new Error('result not found');
    expect(reloaded.orderedItems!.length).toBeGreaterThanOrEqual(2);
    const updated = reloaded.orderedItems!.find((x) => x.id === existing.id);
    expect(updated?.quantity).toEqual(5);
  });

  // test findAll()
  it('should find all orders', async () => {
    const repoResult = await orderRepo.find();
    const serviceResult = await orderService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with search by recipient
  it('should find all orders with search by recipient', async () => {
    const serviceResult = await orderService.findAll({
      search: 'recipient',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(
      serviceResult?.items.every((o) =>
        o.recipient.toLowerCase().includes('recipient'),
      ),
    ).toBe(true);
  });

  // test findAll() with search by menuItem name
  it('should find all orders with search by menuItem name', async () => {
    const serviceResult = await orderService.findAll({
      search: 'item',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    // expect each order to have an orderedItem with a menuItem name that includes 'item'
    expect(
      serviceResult?.items.every((o) =>
        o.orderedItems?.some((oi) =>
          oi.menuItem?.name?.toLowerCase().includes('item'),
        ),
      ),
    ).toBe(true);
  });

  // test findAll() with filter by category
  it('should find all orders with filter by category', async () => {
    const [cat] = await categoryRepo.find({ where: { name: TYPE_A } });
    if (!cat) throw new Error('category not found');
    const repoResult = await orderRepo.find({
      where: { category: { id: cat.id } },
    });
    const serviceResult = await orderService.findAll({
      filters: [`category=${cat.id}`],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with filter by isFrozen
  it('should find all orders with filter by isFrozen', async () => {
    const serviceResult = await orderService.findAll({
      filters: ['isFrozen=false'],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.every((o) => !o.isFrozen)).toBe(true);
  });

  // test findAll() with filter by fulfillmentType
  it('should find all orders with filter by fulfillmentType', async () => {
    const serviceResult = await orderService.findAll({
      filters: ['fulfillmentType=pickup'],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(
      serviceResult?.items.every((o) => o.fulfillmentType === 'pickup'),
    ).toBe(true);
  });

  // test findAll() by applyDate with startDate and endDate
  it('should find all orders by applyDate with startDate and endDate', async () => {
    const sDate = new Date('2020-01-01');
    const eDate = new Date('2030-12-31');
    const repoResult = await orderRepo.find({
      where: {
        fulfillmentDate: Between(sDate, eDate),
      },
    });
    const serviceResult = await orderService.findAll({
      startDate: sDate.toISOString(),
      endDate: eDate.toISOString(),
      dateBy: 'fulfillmentDate',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    // expect each order to have a fulfillmentDate between sDate and eDate
    expect(
      serviceResult?.items.every(
        (o) => o.fulfillmentDate >= sDate && o.fulfillmentDate <= eDate,
      ),
    ).toBe(true);
  });

  // test findAll() sortBy category
  it('should find all orders with sortBy category', async () => {
    const repoResult = await orderRepo.find({
      order: { category: { name: 'DESC' } },
    });
    if (!repoResult.length) throw new Error('orders not found');
    const serviceResult = await orderService.findAll({
      sortBy: 'category',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    // expect first item of serviceResult and category result to be the same
    expect(serviceResult?.items[0]?.category?.name).toEqual(
      repoResult[0]?.category?.name,
    );
    // expect last item of serviceResult and category result to be the same
    expect(
      serviceResult?.items[serviceResult.items.length - 1]?.category?.name,
    ).toEqual(repoResult[repoResult.length - 1]?.category?.name);
  });

  // test findAll() sortBy fulfillmentDate
  it('should find all orders with sortBy fulfillmentDate', async () => {
    const repoResult = await orderRepo.find({
      order: { fulfillmentDate: 'DESC' },
    });
    if (!repoResult.length) throw new Error('orders not found');
    const serviceResult = await orderService.findAll({
      sortBy: 'fulfillmentDate',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    // expect first item of serviceResult and fulfillmentDate result to be the same
    expect(serviceResult?.items[0]?.fulfillmentDate).toEqual(
      repoResult[0]?.fulfillmentDate,
    );
    // expect last item of serviceResult and fulfillmentDate result to be the same
    expect(
      serviceResult?.items[serviceResult.items.length - 1]?.fulfillmentDate,
    ).toEqual(repoResult[repoResult.length - 1]?.fulfillmentDate);
  });

  // test findAll() sortBy createdAt
  it('should find all orders with sortBy createdAt', async () => {
    const repoResult = await orderRepo.find({
      order: { createdAt: 'DESC' },
    });
    if (!repoResult.length) throw new Error('orders not found');
    const serviceResult = await orderService.findAll({
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    // expect first item of serviceResult and createdAt result to be the same
    expect(serviceResult?.items[0]?.createdAt).toEqual(
      repoResult[0]?.createdAt,
    );
    // expect last item of serviceResult and createdAt result to be the same
    expect(
      serviceResult?.items[serviceResult.items.length - 1]?.createdAt,
    ).toEqual(repoResult[repoResult.length - 1]?.createdAt);
  });

  // test findOne()
  it('should find one order', async () => {
    const [o] = await orderRepo.find({ take: 1 });
    if (!o) throw new Error('order not found');

    const serviceResult = await orderService.findOne(o.id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(o.id);
  });

  // test findOne() with relations
  it('should find one order with relations', async () => {
    const [o] = await orderRepo.find({ take: 1 });
    if (!o) throw new Error('order not found');

    const serviceResult = await orderService.findOne(o.id, [
      'category',
      'orderedItems',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(o.id);
    expect(serviceResult?.category).toBeDefined();
    expect(Array.isArray(serviceResult?.orderedItems)).toBe(true);
  });

  // test remove()
  it('should remove order', async () => {
    const o = await orderRepo.findOne({
      where: { recipient: 'Test Recipient' },
    });
    if (!o) throw new Error('order not found (create "Test Recipient" first)');
    const id = o.id;

    const deleteResult = await orderService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(orderService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
