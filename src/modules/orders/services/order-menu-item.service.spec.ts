import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_b, item_f } from '../../menu-items/utils/constants';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
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

  it('should fail to create orderMenuItem (Bad Request) then create properly for future tests', async () => {
    const ordersRequest = await orderService.findAll();
    const testOrder = ordersRequest.items[0];
    if (!testOrder) {
      throw new Error();
    }
    testOrderId = testOrder.id;

    const item = await menuItemService.findOneByName(item_a, ['sizes']);
    if (!item) {
      throw new NotFoundException();
    }
    if (!item.sizes) {
      throw new Error();
    }
    if (item.sizes.length === 0) {
      throw new Error();
    }

    /*const dto = {
      orderId: testOrderId,
      menuItemId: item.id,
      menuItemSizeId: item.validSizes[0].id,
      quantity: 1,
    } as CreateOrderMenuItemDto;

    await expect(orderItemService.create(dto)).rejects.toThrow(
      BadRequestException,
    );*/

    const createItemDto = plainToInstance(NestedCreateOrderMenuItemDto, {
      createId: 'c1',
      menuItemId: item.id,
      sizeId: item.sizes[0].id,
      quantity: 1,
    });

    const updateOrderDto = {
      orderedItems: [createItemDto],
    } as UpdateOrderDto;

    const updateResult = await orderService.update(testOrderId, updateOrderDto);
    if (!updateResult) {
      throw new Error();
    }
    if (!updateResult.orderedItems) {
      throw new Error();
    }

    const result = updateResult.orderedItems[0];

    expect(result).not.toBeNull();
    expect(result?.parentOrder.id).toEqual(testOrderId);
    expect(result?.quantity).toEqual(1);
    expect(result?.menuItem.id).toEqual(item.id);
    expect(result?.size.id).toEqual(item.sizes[0].id);

    testId = result?.id as number;
  });

  it('should update order query with new item', async () => {
    const testOrder = await orderService.findOne(testOrderId, ['orderedItems']);
    if (!testOrder) {
      throw new NotFoundException();
    }
    if (!testOrder.orderedItems) {
      throw new Error();
    }

    expect(
      testOrder.orderedItems.findIndex((item) => item.id === testId),
    ).not.toEqual(-1);
  });

  it('should find orderMenuItem by id', async () => {
    const result = await orderItemService.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.quantity).toEqual(1);
  });

  it('should update menuItem', async () => {
    const newItem = await menuItemService.findOneByName(item_b, ['sizes']);
    if (!newItem) {
      throw new NotFoundException();
    }
    if (!newItem.sizes) {
      throw new Error();
    }
    if (newItem.sizes.length < 2) {
      throw new Error();
    }

    const dto = {
      menuItemId: newItem.id,
      sizeId: newItem.sizes[0].id,
    } as UpdateOrderMenuItemDto;

    const result = await orderItemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }
    expect(result).not.toBeNull();
    expect(result?.menuItem.id).toEqual(newItem.id);
    expect(result?.size.id).toEqual(newItem.sizes[0].id);
  });

  it('should update quantity', async () => {
    const dto = {
      quantity: 2,
    } as UpdateOrderMenuItemDto;

    const result = await orderItemService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.quantity).toEqual(2);
  });

  it('should update size', async () => {
    const newItem = await menuItemService.findOneByName(item_b, ['sizes']);
    if (!newItem) {
      throw new NotFoundException();
    }
    if (!newItem.sizes) {
      throw new Error();
    }
    if (newItem.sizes.length < 2) {
      throw new Error();
    }

    const dto = {
      sizeId: newItem.sizes[1].id,
    } as UpdateOrderMenuItemDto;

    const result = await orderItemService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.size.id).toEqual(newItem.sizes[1].id);
  });

  it('should find all orderMenuItems', async () => {
    const orderItemsRequest = await orderItemService.findAll({ limit: 40 });
    const items = orderItemsRequest.items;

    testIds = [items[0].id, items[1].id, items[2].id];

    expect(items.length).toEqual(25);
  });

  it('should sort all orderMenuItems by quantity', async () => {
    const orderItemsRequest = await orderItemService.findAll({
      limit: 40,
      sortBy: 'quantity',
    });
    const items = orderItemsRequest.items;

    testIds = [items[0].id, items[1].id, items[2].id];
  });

  it('should sort all orderMenuItems by item', async () => {
    const orderItemsRequest = await orderItemService.findAll({
      limit: 40,
      sortBy: 'menuItem',
    });
    const items = orderItemsRequest.items;

    testIds = [items[0].id, items[1].id, items[2].id];
  });

  it('should get orderMenuItems by list of ids', async () => {
    const results = await orderItemService.findEntitiesById(testIds);
    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove orderMenuItem', async () => {
    const removal = await orderItemService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(orderItemService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update order query to not contain deleted item', async () => {
    const testOrder = await orderService.findOne(testOrderId, ['orderedItems']);
    if (!testOrder) {
      throw new NotFoundException();
    }
    if (!testOrder.orderedItems) {
      throw new Error();
    }

    expect(
      testOrder.orderedItems.findIndex((item) => item.id === testId),
    ).toEqual(-1);
  });

  it('should create an order item with container items', async () => {
    const items = (
      await menuItemService.findAll({
        relations: [
          'containerMenuItems',
          'sizes',
          'containerMenuItems.containedMenuItem',
          'containerMenuItems.containedItemSize',
        ],
        limit: 20,
      })
    ).items;

    const containerItems = items.filter((item) => item.containerMenuItems);

    if (!containerItems[0].containerMenuItems) {
      throw new Error();
    }

    const containerItemDtos = [
      plainToInstance(NestedCreateOrderContainerItemDto, {
        createId: 'c1',
        containedMenuItemId:
          containerItems[0].containerMenuItems[0].containedMenuItem.id,
        containedMenuItemSizeId:
          containerItems[0].containerMenuItems[0].containedItemSize.id,
        quantity: 1,
      }),
    ];

    const orders = (await orderService.findAll({ relations: ['orderedItems'] }))
      .items;

    const itemF = await menuItemService.findOneByName(item_f, ['sizes']);
    if (!itemF) {
      throw new Error();
    }
    if (!itemF.sizes) {
      throw new Error();
    }

    const itemDto = plainToInstance(NestedCreateOrderMenuItemDto, {
      createId: 'c1',
      menuItemId: containerItems[0].id,
      sizeId: containerItems[0].sizes[0].id,
      quantity: 1,
      containerOrderMenuItems: containerItemDtos,
    });

    const updateOrderDto = {
      orderedItems: [itemDto],
    } as UpdateOrderDto;

    const updateResult = await orderService.update(
      orders[0].id,
      updateOrderDto,
    );
    if (!updateResult) {
      throw new Error();
    }
    if (!updateResult.orderedItems) {
      throw new Error();
    }

    const result = updateResult.orderedItems[0];
    if (!result) {
      throw new Error();
    }
    if (!result.containerOrderMenuItems) {
      throw new Error();
    }
    expect(result.containerOrderMenuItems.length).toEqual(1);

    testOrderItemCompsId = result.id;
  });

  it('should update item container (add)', async () => {
    const toUpdate = await orderItemService.findOne(testOrderItemCompsId, [
      'containerOrderMenuItems',
      'menuItem',
    ]);
    if (!toUpdate) {
      throw new Error();
    }
    if (!toUpdate.containerOrderMenuItems) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      toUpdate.menuItem.id,
      ['containerMenuItems', 'sizes'],
      ['containerMenuItems', 'containedItemSize'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }
    if (!parentMenuItem.containerMenuItems) {
      throw new Error();
    }

    const cDto = plainToInstance(NestedCreateOrderContainerItemDto, {
      createId: 'c1',
      containedMenuItemId:
        parentMenuItem.containerMenuItems[0].containedMenuItem.id,
      containedItemSizeId:
        parentMenuItem.containerMenuItems[0].containedItemSize.id,
      quantity: 2,
    });

    const theRest = toUpdate.containerOrderMenuItems.map((comp) =>
      plainToInstance(NestedUpdateOrderContainerItemDto, {
        id: comp.id,
      }),
    );

    const dto = {
      containerOrderMenuItems: [cDto, ...theRest],
    } as UpdateOrderMenuItemDto;

    const result = await orderItemService.update(testOrderItemCompsId, dto);
    if (!result) {
      throw new Error();
    }
    if (!result.containerOrderMenuItems) {
      throw new Error();
    }
    expect(result.containerOrderMenuItems.length).toEqual(
      toUpdate.containerOrderMenuItems.length + 1,
    );
  });

  it('should update item container (modify)', async () => {
    const toUpdate = await orderItemService.findOne(testOrderItemCompsId, [
      'containerOrderMenuItems',
      'menuItem',
    ]);
    if (!toUpdate) {
      throw new Error();
    }
    if (!toUpdate.containerOrderMenuItems) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      toUpdate.menuItem.id,
      ['containerMenuItems'],
      ['containedItemSize'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }
    if (!parentMenuItem.containerMenuItems) {
      throw new Error();
    }

    const theRest = toUpdate.containerOrderMenuItems.map((comp) =>
      plainToInstance(NestedUpdateOrderContainerItemDto, {
        id: comp.id,
      }),
    );

    theRest[0] = plainToInstance(NestedUpdateOrderContainerItemDto, {
      id: theRest[0].id,
      containedItemSizeId:
        parentMenuItem.containerMenuItems[0].containedItemSize.id,
      quantity: 50,
    });

    const moddedId = theRest[0].id;

    const dto = {
      containerOrderMenuItems: theRest,
    } as UpdateOrderMenuItemDto;

    const result = await orderItemService.update(testOrderItemCompsId, dto);
    if (!result) {
      throw new Error();
    }

    if (!result.containerOrderMenuItems) {
      throw new Error();
    }

    for (const comp of result.containerOrderMenuItems) {
      if (comp.id === moddedId) {
        expect(comp.containedItemSize.id).toEqual(
          parentMenuItem.containerMenuItems[0].containedItemSize.id,
        );
        expect(comp.quantity).toEqual(50);
      }
    }
  });

  it('should update item components (remove)', async () => {
    const toUpdate = await orderItemService.findOne(testOrderItemCompsId, [
      'containerOrderMenuItems',
    ]);
    if (!toUpdate) {
      throw new Error();
    }
    if (!toUpdate.containerOrderMenuItems) {
      throw new Error();
    }

    const theRest = toUpdate.containerOrderMenuItems.slice(1).map((comp) =>
      plainToInstance(NestedUpdateOrderContainerItemDto, {
        id: comp.id,
      }),
    );

    const removedId = toUpdate.containerOrderMenuItems[0].id;

    const dto = {
      containerOrderMenuItems: theRest,
    } as UpdateOrderMenuItemDto;

    const result = await orderItemService.update(testOrderItemCompsId, dto);
    if (!result) {
      throw new Error();
    }
    if (!result.containerOrderMenuItems) {
      throw new Error();
    }
    expect(result.containerOrderMenuItems.length).toEqual(
      toUpdate.containerOrderMenuItems.length - 1,
    );

    await expect(containerItemService.findOne(removedId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
