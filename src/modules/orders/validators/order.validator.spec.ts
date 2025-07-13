import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { DUPLICATE, INVALID } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { type_a } from '../../labels/utils/constants';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import {
  item_a,
  item_b,
  item_c,
  item_d,
} from '../../menu-items/utils/constants';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
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
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: itemB.id,
        menuItemSizeId: itemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
    ] as CreateOrderMenuItemDto[];
    const dto = {
      orderCategoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedMenuItemDtos: itemDtos,
    } as CreateOrderDto;

    await validator.validateCreate(dto);
  });

  it('should fail create: duplicate order menu item DTOs', async () => {
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
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: itemB.id,
        menuItemSizeId: itemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
    ] as CreateOrderMenuItemDto[];
    const dto = {
      orderCategoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedMenuItemDtos: itemDtos,
    } as CreateOrderDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
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
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: itemB.id,
        menuItemSizeId: itemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        id: itemToUpdate.id,
        menuItemId: itemC.id,
        menuItemSizeId: itemC.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderMenuItemDto,
    ] as (CreateOrderMenuItemDto | UpdateOrderMenuItemDto)[];

    const dto = {
      orderCategoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedMenuItemDtos: itemDtos,
    } as UpdateOrderDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update: duplicate create order item dtos', async () => {
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
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: itemB.id,
        menuItemSizeId: itemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        id: itemToUpdate.id,
        menuItemId: itemC.id,
        menuItemSizeId: itemC.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderMenuItemDto,
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
    ] as (CreateOrderMenuItemDto | UpdateOrderMenuItemDto)[];

    const dto = {
      orderCategoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedMenuItemDtos: itemDtos,
    } as UpdateOrderDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail update: duplicate update order item dtos', async () => {
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

    const itemD = await menuItemService.findOneByName(item_d, ['validSizes']);
    if (!itemD) {
      throw new Error();
    }

    const itemToUpdate = (await orderItemService.findAll()).items[0];

    const itemDtos = [
      {
        menuItemId: itemA.id,
        menuItemSizeId: itemA.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        menuItemId: itemB.id,
        menuItemSizeId: itemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderMenuItemDto,
      {
        id: itemToUpdate.id,
        menuItemId: itemC.id,
        menuItemSizeId: itemC.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderMenuItemDto,
      {
        id: itemToUpdate.id,
        menuItemId: itemD.id,
        menuItemSizeId: itemD.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderMenuItemDto,
    ] as (CreateOrderMenuItemDto | UpdateOrderMenuItemDto)[];

    const dto = {
      orderCategoryId: category.id,
      recipient: 'CREATE',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      orderedMenuItemDtos: itemDtos,
    } as UpdateOrderDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });
});
