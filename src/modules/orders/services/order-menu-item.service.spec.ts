import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_f } from '../../menu-items/utils/constants';
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
  let orderItemService: TestableOrderMenuItemService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let orderMenuItemRepo: Repository<OrderMenuItem>;
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
    orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
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
  it('should create order menu item', async () => {
    const [order] = await orderRepo.find({ take: 1 });
    const [menuItem] = await menuItemRepo.find({
      relations: ['sizes'],
      take: 1,
    });
    if (!order || !menuItem?.sizes?.length)
      throw new Error('fixtures not found');

    const dto: CreateOrderMenuItemDto = {
      parentOrderId: order.id,
      menuItemId: menuItem.id,
      sizeId: menuItem.sizes[0].id,
      quantity: 2,
    };

    await dataSource.transaction(async (manager) => {
      const result = await orderItemService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.quantity).toEqual(dto.quantity);
    });
  });

  // test createEntity() with NestedCreateOrderContainerItemDtos
  it('should create order menu item with NestedCreateOrderContainerItemDtos', async () => {
    const [order] = await orderRepo.find({ take: 1 });
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
      !order ||
      !container?.sizes?.length ||
      !container.containerMenuItems?.length
    )
      throw new Error(
        'fixtures not found (need order and container item_f with containerMenuItems)',
      );

    const c0 = container.containerMenuItems[0];
    const dto: CreateOrderMenuItemDto = {
      parentOrderId: order.id,
      menuItemId: container.id,
      sizeId: container.sizes[0].id,
      quantity: 1,
      containerOrderMenuItems: [
        {
          createId: 'c1',
          containedMenuItemId: c0.containedMenuItem.id,
          containedItemSizeId: c0.containedItemSize.id,
          quantity: 3,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      const result = await orderItemService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.containerOrderMenuItems).toBeDefined();
      expect(Array.isArray(result.containerOrderMenuItems)).toBe(true);
      expect(result.containerOrderMenuItems!.length).toBeGreaterThan(0);
    });
  });

  // test updateEntity()
  it('should update order menu item', async () => {
    const [existing] = await orderMenuItemRepo.find({ take: 1 });
    if (!existing) throw new Error('order menu item not found');

    const dto: UpdateOrderMenuItemDto = { quantity: 10 };

    await dataSource.transaction(async (manager) => {
      await orderItemService.updateEntityForTest(dto, existing, manager);
      await manager.save(existing);
    });

    const result = await orderMenuItemRepo.findOne({
      where: { id: existing.id },
    });
    if (!result) throw new Error('result not found');
    expect(result.quantity).toEqual(dto.quantity);
  });

  // test updateEntity() with NestedUpdate and NestedCreate for container
  it('should update order menu item whos menuItem is of type container with NestedUpdateOrderContainerItemDto and NestedCreateOrderContainerItemDto', async () => {
    const oi = await orderMenuItemRepo.findOne({
      where: {},
      relations: [
        'menuItem',
        'size',
        'containerOrderMenuItems',
        'containerOrderMenuItems.containedMenuItem',
        'containerOrderMenuItems.containedItemSize',
      ],
    });
    if (!oi?.containerOrderMenuItems?.length || !oi.menuItem)
      throw new Error('order menu item with containerOrderMenuItems not found');

    const c0 = oi.containerOrderMenuItems[0];

    const containedItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!containedItem) throw new Error('contained item not found');

    const dto: UpdateOrderMenuItemDto = {
      containerOrderMenuItems: [
        { id: c0.id, quantity: 7 },
        {
          createId: 'c2',
          containedMenuItemId: containedItem.id,
          containedItemSizeId: containedItem.sizes[0].id,
          quantity: 5,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      await orderItemService.updateEntityForTest(dto, oi, manager);
      await manager.save(oi);
    });

    const updated = await containerItemRepo.findOne({ where: { id: c0.id } });
    if (!updated) throw new Error('result not found');
    expect(updated.quantity).toEqual(7);

    const updatedItem = await orderMenuItemRepo.findOne({
      where: { id: oi.id },
    });
    if (!updatedItem) throw new Error('updated item not found');
    // expect to find created item in containerOrderMenuItems by seraching for containedMenuItem id, containedItemSize id, and quantity = 5
    expect(
      updatedItem.containerOrderMenuItems?.find(
        (c) =>
          c.containedMenuItem.id === containedItem.id &&
          c.containedItemSize.id === containedItem.sizes[0].id &&
          c.quantity === 5,
      ),
    ).not.toBeNull();
  });

  // test findAll()
  it('should find all order menu items', async () => {
    const repoResult = await orderMenuItemRepo.find();
    const serviceResult = await orderItemService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() sortBy quantity
  it('should find all order menu items with sortBy quantity', async () => {
    const repoResult = await orderMenuItemRepo.find({
      order: { quantity: 'DESC' },
    });
    if (!repoResult.length) throw new Error('order menu items not found');
    const serviceResult = await orderItemService.findAll({
      sortBy: 'quantity',
      sortOrder: 'DESC',
      limit: 100,
    });
    if (!serviceResult) throw new Error('service result not found');
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    // expect first item of serviceResult and quantity result to be the same
    expect(serviceResult?.items[0]?.quantity).toEqual(repoResult[0]?.quantity);
    // expect last item of serviceResult and quantity result to be the same
    expect(
      serviceResult?.items[serviceResult.items.length - 1]?.quantity,
    ).toEqual(repoResult[repoResult.length - 1]?.quantity);
  });

  // test findAll() sortBy menuItem name
  it('should find all order menu items with sortBy menuItem name', async () => {
    const repoResult = await orderMenuItemRepo.find({
      order: { menuItem: { name: 'DESC' } },
    });
    if (!repoResult.length) throw new Error('order menu items not found');
    const serviceResult = await orderItemService.findAll({
      sortBy: 'menuItem',
      sortOrder: 'DESC',
      limit: 100,
    });
    if (!serviceResult) throw new Error('service result not found');
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    // expect first item of serviceResult and menuItem name result to be the same
    expect(serviceResult?.items[0]?.menuItem?.name).toEqual(
      repoResult[0]?.menuItem?.name,
    );
    // expect last item of serviceResult and menuItem name result to be the same
    expect(
      serviceResult?.items[serviceResult.items.length - 1]?.menuItem?.name,
    ).toEqual(repoResult[repoResult.length - 1]?.menuItem?.name);
  });

  // test findOne()
  it('should find one order menu item', async () => {
    const [oi] = await orderMenuItemRepo.find({ take: 1 });
    if (!oi) throw new Error('order menu item not found');

    const serviceResult = await orderItemService.findOne(oi.id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(oi.id);
  });

  // test findOne() with relations
  it('should find one order menu item with relations', async () => {
    const [oi] = await orderMenuItemRepo.find({ take: 1 });
    if (!oi) throw new Error('order menu item not found');

    const serviceResult = await orderItemService.findOne(oi.id, [
      'parentOrder',
      'menuItem',
      'containerOrderMenuItems',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(oi.id);
    expect(serviceResult?.parentOrder).toBeDefined();
    expect(serviceResult?.menuItem).toBeDefined();
    expect(Array.isArray(serviceResult?.containerOrderMenuItems)).toBe(true);
  });

  // test remove()
  it('should remove order menu item', async () => {
    const [oi] = await orderMenuItemRepo.find({ take: 1 });
    if (!oi) throw new Error('order menu item not found');
    const id = oi.id;

    const deleteResult = await orderItemService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(orderItemService.findOne(id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
