import { NotImplementedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { type_a } from '../../labels/utils/constants';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b, item_c } from '../../menu-items/utils/constants';
import { NestedOrderMenuItemDto } from '../dto/order-menu-item/nested-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategoryService } from '../services/order-category.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { OrderService } from '../services/order.service';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderValidator } from './order.validator';

describe('order validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderValidator;
  let orderService: OrderService;
  let categoryService: OrderCategoryService;
  let orderItemService: OrderMenuItemService;
  let menuItemService: MenuItemService;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    validator = module.get<OrderValidator>(OrderValidator);
    orderService = module.get<OrderService>(OrderService);
    categoryService = module.get<OrderCategoryService>(OrderCategoryService);
    orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
    menuItemService = module.get<MenuItemService>(MenuItemService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const category = await categoryService.findOneByName(type_a);
    if (!category) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemA.id,
          menuItemSizeId: itemA.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemB.id,
          menuItemSizeId: itemB.sizes[0].id,
          quantity: 1,
        },
      }),
    ];
    const dto = {
      categoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedItemDtos: itemDtos,
    } as CreateOrderDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: invalid weekly fulfillment', async () => {
    throw new NotImplementedException();
  });

  it('should fail create: invalid fulfillment type', async () => {
    throw new NotImplementedException();
  });

  it('should fail create: nested orderMenuItem validator: invalid size for item', async () => {
    const category = await categoryService.findOneByName(type_a);
    if (!category) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemA.id,
          menuItemSizeId: itemB.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemB.id,
          menuItemSizeId: itemA.sizes[0].id,
          quantity: 1,
        },
      }),
    ];
    const dto = {
      categoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedItemDtos: itemDtos,
    } as CreateOrderDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.field).toEqual('orderedItems');
    expect(result?.children[0].children.length).toEqual(1);
  });

  it('should pass update', async () => {
    const toUpdate = (await orderService.findAll()).items[0];

    const category = await categoryService.findOneByName(type_a);
    if (!category) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const itemC = await menuItemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new Error();
    }

    const itemToUpdate = (await orderItemService.findAll()).items[0];

    const itemDtos = [
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemA.id,
          menuItemSizeId: itemA.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemB.id,
          menuItemSizeId: itemB.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'update',
        id: itemToUpdate.id,
        updateDto: {
          menuItemId: itemC.id,
          menuItemSizeId: itemC.sizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      categoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedItemDtos: itemDtos,
    } as UpdateOrderDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: invalid weekly fulfillment', async () => {
    throw new NotImplementedException();
  });

  it('should fail update: invalid fulfillment type', async () => {
    throw new NotImplementedException();
  });

  it('should fail update: nested orderMenuItem validator: invalid size', async () => {
    const toUpdate = (await orderService.findAll()).items[0];

    const category = await categoryService.findOneByName(type_a);
    if (!category) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const itemC = await menuItemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new Error();
    }

    const itemToUpdate = (await orderItemService.findAll()).items[0];

    const itemDtos = [
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemA.id,
          menuItemSizeId: itemA.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'create',
        createDto: {
          menuItemId: itemB.id,
          menuItemSizeId: itemB.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderMenuItemDto, {
        mode: 'update',
        id: itemToUpdate.id,
        updateDto: {
          menuItemId: itemC.id,
          menuItemSizeId: itemA.sizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      categoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedItemDtos: itemDtos,
    } as UpdateOrderDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.field).toEqual('orderedItems');
    expect(result?.children[0].children.length).toEqual(1);
  });
});
