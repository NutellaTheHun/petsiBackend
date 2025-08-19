import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { MenuItemContainerOptionsService } from '../../menu-items/services/menu-item-container-options.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b } from '../../menu-items/utils/constants';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedOrderContainerItemDto } from '../dto/order-container-item/nested-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedOrderMenuItemDto } from '../dto/order-menu-item/nested-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { TYPE_A, TYPE_B, TYPE_C, TYPE_D } from '../utils/constants';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryService } from './order-category.service';
import { OrderMenuItemService } from './order-menu-item.service';
import { OrderService } from './order.service';

describe('order service', () => {
  let orderService: OrderService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let categoryService: OrderCategoryService;
  let orderItemService: OrderMenuItemService;

  let menuItemService: MenuItemService;
  let optionService: MenuItemContainerOptionsService;
  let menuItemTestUtil: MenuItemTestingUtil;

  let testId: number;
  let testIds: number[];

  let modifiedItemId: number;
  let deletedItemId: number;

  let removedItemIds: number[];
  let removedTypeId: number;

  let testOrderCompItemId: number;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();

    dbTestContext = new DatabaseTestContext();

    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemContainerTestDatabase(dbTestContext);

    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderTestDatabase(dbTestContext);

    orderService = module.get<OrderService>(OrderService);
    categoryService = module.get<OrderCategoryService>(OrderCategoryService);
    orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);

    menuItemService = module.get<MenuItemService>(MenuItemService);
    optionService = module.get<MenuItemContainerOptionsService>(
      MenuItemContainerOptionsService,
    );
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  it('should create an order (with menuItems)', async () => {
    const type = await categoryService.findOneByName(TYPE_B);
    if (!type) {
      throw new NotFoundException();
    }

    const fulfillDate = new Date();

    const itemDtos = await testingUtil.getCreateChildOrderMenuItemDtos(3);
    const dto = {
      orderCategoryId: type.id,
      recipient: 'test recipient',
      fulfillmentDate: fulfillDate,
      fulfillmentType: 'delivery',
      deliveryAddress: 'testDelAdr',
      phoneNumber: 'testPhone#',
      email: 'testEmail',
      note: 'testNote',
      isFrozen: false,
      isWeekly: false,
      weeklyFulfillment: 'sunday',
      orderedMenuItemDtos: itemDtos,
    } as CreateOrderDto;

    try {
      const result = await orderService.create(dto);
      expect(result).not.toBeNull();
      expect(result?.deliveryAddress).toEqual('testDelAdr');
      expect(result?.email).toEqual('testEmail');
      expect(result?.fulfillmentDate).toEqual(fulfillDate);
      expect(result?.fulfillmentType).toEqual('delivery');
      expect(result?.isFrozen).toEqual(false);
      expect(result?.isWeekly).toEqual(false);
      expect(result?.weeklyFulfillment).toEqual('sunday');
      expect(result?.note).toEqual('testNote');
      expect(result?.phoneNumber).toEqual('testPhone#');
      expect(result?.recipient).toEqual('test recipient');
      expect(result?.orderCategory.id).toEqual(type.id);
      expect(result?.orderedItems?.length).toEqual(3);

      testId = result?.id as number;
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });

  it('should find an order by id', async () => {
    const result = await orderService.findOne(testId);

    expect(result).not.toBeNull();
  });

  it('should update order type', async () => {
    const newType = await categoryService.findOneByName(TYPE_C);
    if (!newType) {
      throw new NotFoundException();
    }

    const dto = {
      orderCategoryId: newType.id,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.orderCategory.id).toEqual(newType.id);
  });

  // Order Type *****
  it('should gain reference by orderType', async () => {
    const orderType = await categoryService.findOneByName(TYPE_C, ['orders']);
    if (!orderType) {
      throw new NotFoundException();
    }

    expect(
      orderType.orders?.findIndex((order) => order.id === testId),
    ).not.toEqual(-1);
  });

  // Order Type
  it('should update order type again', async () => {
    const newType = await categoryService.findOneByName(TYPE_D);
    if (!newType) {
      throw new NotFoundException();
    }

    const dto = {
      orderCategoryId: newType.id,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.orderCategory.id).toEqual(newType.id);
  });

  it('should lose reference from previous orderType', async () => {
    const orderType = await categoryService.findOneByName(TYPE_C, ['orders']);
    if (!orderType) {
      throw new NotFoundException();
    }

    expect(orderType.orders?.findIndex((order) => order.id === testId)).toEqual(
      -1,
    );
  });

  it('should gain reference by new orderType', async () => {
    const orderType = await categoryService.findOneByName(TYPE_D, ['orders']);
    if (!orderType) {
      throw new NotFoundException();
    }

    expect(
      orderType.orders?.findIndex((order) => order.id === testId),
    ).not.toEqual(-1);
  });

  it('should update recipient', async () => {
    const dto = {
      recipient: 'UPDATED recipient',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.recipient).toEqual('UPDATED recipient');
  });

  it('should update fulfillmentContact', async () => {
    const dto = {
      fulfillmentContactName: 'UPDATED fulfillmentContact',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.fulfillmentContactName).toEqual(
      'UPDATED fulfillmentContact',
    );
  });

  it('should update fulfillment date', async () => {
    const newDate = new Date();

    const dto = {
      fulfillmentDate: newDate,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.fulfillmentDate).toEqual(newDate);
  });

  it('should update fulfillment type', async () => {
    const dto = {
      fulfillmentType: 'delivery',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.fulfillmentType).toEqual('delivery');
  });

  it('should update delivery address', async () => {
    const dto = {
      deliveryAddress: 'UPDATE DEL ADDR',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.deliveryAddress).toEqual('UPDATE DEL ADDR');
  });

  it('should update phone number', async () => {
    const dto = {
      phoneNumber: 'UPDATE PHONE #',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.phoneNumber).toEqual('UPDATE PHONE #');
  });

  it('should update email', async () => {
    const dto = {
      email: 'UPDATE EMAIL',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.email).toEqual('UPDATE EMAIL');
  });

  it('should update note', async () => {
    const dto = {
      note: 'UPDATE NOTE',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.note).toEqual('UPDATE NOTE');
  });

  it('should update isFrozen', async () => {
    const dto = {
      isFrozen: true,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.isFrozen).toBeTruthy();
  });

  it('should update isWeekly', async () => {
    const dto = {
      isWeekly: true,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.isWeekly).toBeTruthy();
  });

  it('should update weeklyFulfillment', async () => {
    const dto = {
      weeklyFulfillment: 'monday',
    } as UpdateOrderDto;

    const result = await orderService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.weeklyFulfillment).toEqual('monday');
  });

  it('should add items', async () => {
    const order = await orderService.findOne(testId);
    if (!order) {
      throw new NotFoundException();
    }

    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new NotFoundException();
    }
    if (!itemA.validSizes) {
      throw new Error();
    }
    if (itemA.validSizes.length === 0) {
      throw new Error();
    }

    const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new NotFoundException();
    }
    if (!itemB.validSizes) {
      throw new Error();
    }
    if (itemB.validSizes.length === 0) {
      throw new Error();
    }

    const cDtos = [
      {
        mode: 'create',
        createDto: {
          menuItemId: itemA.id,
          menuItemSizeId: itemA.validSizes[0].id,
          quantity: 10,
        },
      },
      {
        mode: 'create',
        createDto: {
          menuItemId: itemB.id,
          menuItemSizeId: itemB.validSizes[0].id,
          quantity: 10,
        },
      },
    ] as NestedOrderMenuItemDto[];

    const orderDto = {
      orderedMenuItemDtos: cDtos,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, orderDto);
    expect(result).not.toBeNull();
    expect(result?.orderedItems?.length).toEqual(2);
  });

  it('should modify items', async () => {
    const order = await orderService.findOne(testId, ['orderedItems']);
    if (!order) {
      throw new NotFoundException();
    }
    if (!order.orderedItems) {
      throw new NotFoundException();
    }

    modifiedItemId = order.orderedItems[0].id;

    const uDto = {
      mode: 'update',
      id: modifiedItemId,
      updateDto: {
        quantity: 100,
      },
    } as NestedOrderMenuItemDto;

    const theRest = order.orderedItems.slice(1).map(
      (item) =>
        ({
          mode: 'update',
          id: item.id,
          updateDto: {},
        }) as NestedOrderMenuItemDto,
    );

    const orderDto = {
      orderedMenuItemDtos: [uDto, ...theRest],
    } as UpdateOrderDto;

    const result = await orderService.update(testId, orderDto);
    if (!result) {
      throw new Error();
    }
    if (!result.orderedItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    for (const item of result?.orderedItems) {
      if (item.id === modifiedItemId) {
        expect(item.quantity).toEqual(100);
      }
    }
  });

  it('should update orderMenuItem when queried by orderMenuItemService', async () => {
    const item = await orderItemService.findOne(modifiedItemId);
    expect(item).not.toBeNull();
    expect(item?.quantity).toEqual(100);
  });

  it('should remove items', async () => {
    const order = await orderService.findOne(testId, ['orderedItems']);
    if (!order) {
      throw new NotFoundException();
    }
    if (!order.orderedItems) {
      throw new NotFoundException();
    }

    deletedItemId = order.orderedItems[0].id;

    const theRest = order.orderedItems.slice(1).map(
      (item) =>
        ({
          mode: 'update',
          id: item.id,
          updateDto: {},
        }) as NestedOrderMenuItemDto,
    );

    const orderDto = {
      orderedMenuItemDtos: theRest,
    } as UpdateOrderDto;

    const result = await orderService.update(testId, orderDto);
    if (!result) {
      throw new Error();
    }
    if (!result.orderedItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result.orderedItems.length).toEqual(1);
    expect(
      result.orderedItems.findIndex((item) => item.id === deletedItemId),
    ).toEqual(-1);
  });

  it('should truly remove deleted orderMenuItem', async () => {
    await expect(orderItemService.findOne(deletedItemId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find all orders', async () => {
    const results = await orderService.findAll({
      relations: ['orderCategory', 'orderedItems'],
    });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);

    testIds = results.items.slice(0, 3).map((o) => o.id);
  });

  it('should search all orders', async () => {
    const results = await orderService.findAll({ search: 'item a' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(1);
  });

  it('should sort all orders by recipient', async () => {
    const results = await orderService.findAll({ sortBy: 'recipient' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should sort all orders by category', async () => {
    const results = await orderService.findAll({ sortBy: 'orderCategory' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should sort all orders by fulfillment date', async () => {
    const results = await orderService.findAll({ sortBy: 'fulfillmentDate' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should sort all orders by create date', async () => {
    const results = await orderService.findAll({ sortBy: 'createdAt' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should filter all orders', async () => {
    const category = await categoryService.findOneByName(TYPE_A);
    if (!category) {
      throw new Error();
    }
    const results = await orderService.findAll({
      filters: [`category=${category.id}`],
    });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(2);
  });

  it('should filter by fulfillment date', async () => {
    const date = new Date();
    const today = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const results = await orderService.findAll({
      startDate: today,
      dateBy: 'fulfillmentDate',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should filter by fulfillment date range', async () => {
    const today = new Date();

    let startYear = today.getFullYear();
    let endYear = today.getFullYear();

    let startMonth = today.getMonth() + 1;
    let endMonth = today.getMonth() + 1;

    let startDate = today.getDate() - 1;
    let endDate = today.getDate() + 1;

    if (today.getDate() === 1) {
      if (startMonth === 1) {
        startMonth = 12;
        startYear--;
      } else {
        startMonth--;
      }
      startDate = 28;
    }
    if (today.getDate() > 28) {
      endDate++;
    }

    const start = `${startMonth}/${startDate}/${startYear}`;
    const end = `${endMonth}/${endDate}/${endYear}`;

    const results = await orderService.findAll({
      startDate: start,
      endDate: end,
      dateBy: 'fulfillmentDate',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should filter by create date', async () => {
    const date = new Date();
    const today = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const results = await orderService.findAll({
      startDate: today,
      dateBy: 'createdAt',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should filter by create date range', async () => {
    const today = new Date();

    let startYear = today.getFullYear();
    let endYear = today.getFullYear();

    let startMonth = today.getMonth() + 1;
    let endMonth = today.getMonth() + 1;

    let startDate = today.getDate() - 1;
    let endDate = today.getDate() + 1;

    if (today.getDate() === 1) {
      if (startMonth === 1) {
        startMonth = 12;
        startYear--;
      } else {
        startMonth--;
      }
      startDate = 28;
    }
    if (today.getDate() > 28) {
      endDate++;
    }

    const start = `${startMonth}/${startDate}/${startYear}`;
    const end = `${endMonth}/${endDate}/${endYear}`;

    const results = await orderService.findAll({
      startDate: start,
      endDate: end,
      dateBy: 'createdAt',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should find orders by list of ids', async () => {
    const results = await orderService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove order', async () => {
    const toRemove = await orderService.findOne(testId, [
      'orderedItems',
      'orderCategory',
    ]);
    if (!toRemove) {
      throw new NotFoundException();
    }
    if (!toRemove.orderedItems) {
      throw new Error();
    }

    removedItemIds = toRemove.orderedItems.map((i) => i.id);
    removedTypeId = toRemove.orderCategory.id;

    const removal = await orderService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(orderService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should remove orderMenuItems', async () => {
    const results = await orderItemService.findEntitiesById(removedItemIds);
    expect(results.length).toEqual(0);
  });

  it('should lose OrderType reference', async () => {
    const type = await categoryService.findOne(removedTypeId, ['orders']);
    if (!type) {
      throw new NotFoundException();
    }

    expect(type.orders?.findIndex((o) => o.id === testId)).toEqual(-1);
  });

  it('should create an order with order menu item with components', async () => {
    const items = (
      await menuItemService.findAll({
        relations: ['containerOptions', 'validSizes'],
        limit: 50,
      })
    ).items;

    const optionItems = items.filter((item) => item.containerOptions);

    if (!optionItems[0].containerOptions) {
      throw new Error();
    }
    const optionItemA = await optionService.findOne(
      optionItems[0].containerOptions.id,
      ['parentContainer'],
    );

    if (!optionItems[1].containerOptions) {
      throw new Error();
    }
    const optionItemB = await optionService.findOne(
      optionItems[1].containerOptions.id,
      ['parentContainer'],
    );

    const compDtos_a = [
      {
        parentContainerMenuItemId: optionItemA.parentContainer.id,
        containedMenuItemId: optionItemA.containerRules[0].validItem.id,
        containedMenuItemSizeId: optionItemA.containerRules[0].validSizes[0].id,
        quantity: 1,
      },
    ] as CreateOrderContainerItemDto[];

    const compDtos_b = [
      {
        parentContainerMenuItemId: optionItemB.parentContainer.id,
        containedMenuItemId: optionItemB.containerRules[0].validItem.id,
        containedMenuItemSizeId: optionItemB.containerRules[0].validSizes[0].id,
        quantity: 1,
      },
    ] as CreateOrderContainerItemDto[];

    const oItemDtos = [
      {
        menuItemId: optionItemA.parentContainer.id,
        menuItemSizeId: optionItems[0].validSizes[0].id,
        quantity: 1,
        orderedItemContainerDtos: compDtos_a,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: optionItemB.parentContainer.id,
        menuItemSizeId: optionItems[1].validSizes[0].id,
        quantity: 1,
        orderedItemContainerDtos: compDtos_b,
      } as CreateOrderMenuItemDto,
    ] as CreateOrderMenuItemDto[];

    const oType = await categoryService.findOneByName(TYPE_A);
    if (!oType) {
      throw new Error();
    }
    const orderDto = {
      orderCategoryId: oType.id,
      recipient: 'order / orderItemComp test',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedMenuItemDtos: oItemDtos,
    } as CreateOrderDto;

    const result = await orderService.create(orderDto);
    if (!result) {
      throw new Error();
    }
    if (!result.orderedItems) {
      throw new Error();
    }
    if (!result.orderedItems[0].orderedContainerItems) {
      throw new Error();
    }
    if (!result.orderedItems[1].orderedContainerItems) {
      throw new Error();
    }
    expect(result.orderedItems[0].orderedContainerItems.length).toEqual(1);
    expect(result.orderedItems[1].orderedContainerItems.length).toEqual(1);

    testOrderCompItemId = result.id;
  });

  it('should modify order menu item container (add)', async () => {
    const order = await orderService.findOne(
      testOrderCompItemId,
      ['orderedItems'],
      ['orderedItems.orderedContainerItems'],
    );
    if (!order) {
      throw new Error();
    }
    if (!order.orderedItems) {
      throw new Error();
    }

    const containerItems = order.orderedItems.filter(
      (item) => item.orderedContainerItems.length > 0,
    );

    const itemToUpdate = await orderItemService.findOne(containerItems[0].id, [
      'menuItem',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      itemToUpdate.menuItem.id,
      ['validSizes', 'containerOptions'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }
    if (!parentMenuItem.containerOptions) {
      throw new Error();
    }

    const options = await optionService.findOne(
      parentMenuItem.containerOptions.id,
    );

    const createCompDto = {
      mode: 'create',
      createDto: {
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: options.containerRules[1].validItem.id,
        containedMenuItemSizeId: options.containerRules[1].validSizes[0].id,
        quantity: 1,
      },
    } as NestedOrderContainerItemDto;

    if (!order.orderedItems[0].orderedContainerItems) {
      throw new Error();
    }
    const updateComponentDtos = order.orderedItems[0].orderedContainerItems.map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
        }) as NestedOrderContainerItemDto,
    );

    const updateOrderItemDto = {
      mode: 'update',
      id: order.orderedItems[0].id,
      updateDto: {
        orderedItemContainerDtos: [createCompDto, ...updateComponentDtos],
      },
    } as NestedOrderMenuItemDto;

    const updatedItemId = order.orderedItems[0].id;
    const originalCompSize = order.orderedItems[0].orderedContainerItems.length;

    const theRest = order.orderedItems.slice(1).map(
      (item) =>
        ({
          mode: 'update',
          id: item.id,
          updateDto: {},
        }) as NestedOrderMenuItemDto,
    );

    const uOrderDto = {
      orderedMenuItemDtos: [updateOrderItemDto, ...theRest],
    } as UpdateOrderDto;

    const result = await orderService.update(testOrderCompItemId, uOrderDto);
    if (!result) {
      throw new Error();
    }
    if (!result.orderedItems) {
      throw new Error();
    }
    for (const item of result.orderedItems) {
      if (item.id === updatedItemId) {
        expect(item.orderedContainerItems?.length).toEqual(
          originalCompSize + 1,
        );
      }
    }
  });

  it('should modify order menu item components (modify)', async () => {
    const order = await orderService.findOne(
      testOrderCompItemId,
      ['orderedItems'],
      ['orderedItems.orderedContainerItems'],
    );
    if (!order) {
      throw new Error();
    }
    if (!order.orderedItems) {
      throw new Error();
    }
    if (!order.orderedItems[0].orderedContainerItems) {
      throw new Error();
    }

    const containerItems = order.orderedItems.filter(
      (item) => item.orderedContainerItems.length > 0,
    );

    const itemToUpdate = await orderItemService.findOne(containerItems[1].id, [
      'menuItem',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      itemToUpdate.menuItem.id,
      ['validSizes', 'containerOptions'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }
    if (!parentMenuItem.containerOptions) {
      throw new Error();
    }

    const options = await optionService.findOne(
      parentMenuItem.containerOptions.id,
    );

    const updateComponentDto = {
      mode: 'update',
      id: order.orderedItems[0].orderedContainerItems[0].id,
      updateDto: {
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: options.containerRules[1].validItem.id,
        containedMenuItemSizeId: options.containerRules[1].validSizes[0].id,
        quantity: 2,
      },
    } as NestedOrderContainerItemDto;

    const moddedCompId = order.orderedItems[1].orderedContainerItems[0].id;
    const moddedItemId = order.orderedItems[1].id;

    const updateItemDto = {
      mode: 'update',
      id: order.orderedItems[1].id,
      updateDto: {
        orderedItemContainerDtos: [updateComponentDto],
      },
    } as NestedOrderMenuItemDto;

    const theRestItems = {
      mode: 'update',
      id: order.orderedItems[0].id,
      updateDto: {},
    } as NestedOrderMenuItemDto;

    const updateOrderDto = {
      orderedMenuItemDtos: [updateItemDto, theRestItems],
    } as UpdateOrderDto;

    const result = await orderService.update(
      testOrderCompItemId,
      updateOrderDto,
    );
    if (!result) {
      throw new Error();
    }

    if (!result.orderedItems) {
      throw new Error();
    }

    for (const item of result.orderedItems) {
      if (item.id === moddedItemId) {
        if (!item.orderedContainerItems) {
          throw new Error();
        }
        for (const comp of item.orderedContainerItems) {
          if (comp.id === moddedCompId) {
            expect(comp.containedItem.id).toEqual(
              options.containerRules[1].validItem.id,
            );
            expect(comp.containedItemSize.id).toEqual(
              options.containerRules[1].validSizes[0].id,
            );
            expect(comp.quantity).toEqual(2);
          }
        }
      }
    }
  });

  it('should modify order menu item components (remove)', async () => {
    const order = await orderService.findOne(
      testOrderCompItemId,
      ['orderedItems'],
      ['orderedItems.orderedContainerItems'],
    );
    if (!order) {
      throw new Error();
    }
    if (!order.orderedItems) {
      throw new Error();
    }
    if (!order.orderedItems[0].orderedContainerItems) {
      throw new Error();
    }

    const theRestComponents = order.orderedItems[0].orderedContainerItems
      .slice(1)
      .map(
        (comp) =>
          ({
            mode: 'update',
            id: comp.id,
            updateDto: {},
          }) as NestedOrderContainerItemDto,
      );

    //const removedComp = order.orderedItems[0].orderedContainerItems[0].id;

    const updateItemDto = {
      mode: 'update',
      id: order.orderedItems[0].id,
      updateDto: {
        orderedItemContainerDtos: theRestComponents,
      },
    } as NestedOrderMenuItemDto;

    const theRestItems = order.orderedItems.slice(1).map(
      (item) =>
        ({
          mode: 'update',
          id: item.id,
          updateItemDto: {},
        }) as NestedOrderMenuItemDto,
    );

    const updateOrderDto = {
      orderedMenuItemDtos: [updateItemDto, ...theRestItems],
    } as UpdateOrderDto;

    const result = await orderService.update(
      testOrderCompItemId,
      updateOrderDto,
    );

    if (!result) {
      throw new Error();
    }

    if (!result.orderedItems) {
      throw new Error();
    }

    expect(result.orderedItems[0].orderedContainerItems?.length).toEqual(
      order.orderedItems[0].orderedContainerItems.length - 1,
    );
  });
});
