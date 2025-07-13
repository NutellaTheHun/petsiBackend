import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { DUPLICATE, INVALID } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import {
  item_a,
  item_b,
  item_c,
  item_d,
} from '../../menu-items/utils/constants';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItemService } from '../services/order-container-item.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemValidator } from './order-menu-item.validator';

describe('order category validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderMenuItemValidator;
  let orderItemservice: OrderMenuItemService;
  let orderContainerservice: OrderContainerItemService;
  let menuItemService: MenuItemService;
  let sizeService: MenuItemSizeService;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    validator = module.get<OrderMenuItemValidator>(OrderMenuItemValidator);

    orderItemservice = module.get<OrderMenuItemService>(OrderMenuItemService);
    orderContainerservice = module.get<OrderContainerItemService>(
      OrderContainerItemService,
    );
    menuItemService = module.get<MenuItemService>(MenuItemService);
    sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);

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
    const item = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!item) {
      throw new Error();
    }

    const contItemB = await menuItemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!contItemB) {
      throw new Error();
    }
    const contItemC = await menuItemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!contItemC) {
      throw new Error();
    }

    const containerDtos = [
      {
        parentContainerMenuItemId: item.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
      {
        parentContainerMenuItemId: item.id,
        containedMenuItemId: contItemC.id,
        containedMenuItemSizeId: contItemC.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
    ] as CreateOrderContainerItemDto[];

    const dto = {
      menuItemId: item.id,
      menuItemSizeId: item.validSizes[0].id,
      quantity: 1,
      orderedItemContainerDtos: containerDtos,
    } as CreateOrderMenuItemDto;

    await validator.validateCreate(dto);
  });

  it('should fail create: invalid dto size for dto item', async () => {
    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const sizes = (await sizeService.findAll()).items;

    const badSizes = sizes.filter(
      (size) => !itemA.validSizes.find((validSize) => validSize.id === size.id),
    );
    const dto = {
      menuItemId: itemA.id,
      menuItemSizeId: badSizes[0].id,
      quantity: 1,
    } as CreateOrderMenuItemDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail create: duplicate containerItem dtos', async () => {
    const item = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!item) {
      throw new Error();
    }

    const contItemB = await menuItemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!contItemB) {
      throw new Error();
    }
    const contItemC = await menuItemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!contItemC) {
      throw new Error();
    }

    const containerDtos = [
      {
        parentContainerMenuItemId: item.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
      {
        parentContainerMenuItemId: item.id,
        containedMenuItemId: contItemC.id,
        containedMenuItemSizeId: contItemC.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
      {
        parentContainerMenuItemId: item.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
    ] as CreateOrderContainerItemDto[];

    const dto = {
      menuItemId: item.id,
      menuItemSizeId: item.validSizes[0].id,
      quantity: 1,
      orderedItemContainerDtos: containerDtos,
    } as CreateOrderMenuItemDto;

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
    const containerItems = (
      await orderContainerservice.findAll({ relations: ['parentOrderItem'] })
    ).items;

    const parentOrderItem = await orderItemservice.findOne(
      containerItems[0].parentOrderItem.id,
      ['order', 'menuItem', 'size'],
    );
    if (!parentOrderItem) {
      throw new Error();
    }
    if (!parentOrderItem.menuItem) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      parentOrderItem.menuItem.id,
      ['validSizes'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }

    const contItemB = await menuItemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!contItemB) {
      throw new Error();
    }
    const contItemC = await menuItemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!contItemC) {
      throw new Error();
    }

    const containerDtos = [
      {
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
      {
        id: containerItems[0].id,
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemC.id,
        containedMenuItemSizeId: contItemC.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderContainerItemDto,
    ] as CreateOrderContainerItemDto[];

    const dto = {
      id: parentOrderItem.id,
      menuItemId: parentMenuItem.id,
      menuItemSizeId: parentMenuItem.validSizes[0].id,
      quantity: 1,
      orderedItemContainerDtos: containerDtos,
    } as UpdateOrderMenuItemDto;

    await validator.validateUpdate(parentOrderItem.id, dto);
  });

  it('should fail update: duplicate create dtos', async () => {
    const containerItems = (
      await orderContainerservice.findAll({ relations: ['parentOrderItem'] })
    ).items;

    const parentOrderItem = await orderItemservice.findOne(
      containerItems[0].parentOrderItem.id,
      ['order', 'menuItem', 'size'],
    );
    if (!parentOrderItem) {
      throw new Error();
    }
    if (!parentOrderItem.menuItem) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      parentOrderItem.menuItem.id,
      ['validSizes'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }

    const contItemB = await menuItemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!contItemB) {
      throw new Error();
    }
    const contItemC = await menuItemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!contItemC) {
      throw new Error();
    }

    const containerDtos = [
      {
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
      {
        id: containerItems[0].id,
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemC.id,
        containedMenuItemSizeId: contItemC.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderContainerItemDto,
      {
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
    ] as CreateOrderContainerItemDto[];

    const dto = {
      id: parentOrderItem.id,
      menuItemId: parentMenuItem.id,
      menuItemSizeId: parentMenuItem.validSizes[0].id,
      quantity: 1,
      orderedItemContainerDtos: containerDtos,
    } as UpdateOrderMenuItemDto;

    try {
      await validator.validateUpdate(parentOrderItem.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail update: duplicate update dtos', async () => {
    const containerItems = (
      await orderContainerservice.findAll({ relations: ['parentOrderItem'] })
    ).items;

    const parentOrderItem = await orderItemservice.findOne(
      containerItems[0].parentOrderItem.id,
      ['order', 'menuItem', 'size'],
    );
    if (!parentOrderItem) {
      throw new Error();
    }
    if (!parentOrderItem.menuItem) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      parentOrderItem.menuItem.id,
      ['validSizes'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }

    const contItemB = await menuItemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!contItemB) {
      throw new Error();
    }
    const contItemC = await menuItemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!contItemC) {
      throw new Error();
    }
    const contItemD = await menuItemService.findOneByName(item_d, [
      'validSizes',
    ]);
    if (!contItemD) {
      throw new Error();
    }

    const containerDtos = [
      {
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemB.id,
        containedMenuItemSizeId: contItemB.validSizes[0].id,
        quantity: 1,
      } as CreateOrderContainerItemDto,
      {
        id: containerItems[0].id,
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemC.id,
        containedMenuItemSizeId: contItemC.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderContainerItemDto,
      {
        id: containerItems[0].id,
        parentContainerMenuItemId: parentMenuItem.id,
        containedMenuItemId: contItemD.id,
        containedMenuItemSizeId: contItemD.validSizes[0].id,
        quantity: 1,
      } as UpdateOrderContainerItemDto,
    ] as CreateOrderContainerItemDto[];

    const dto = {
      id: parentOrderItem.id,
      menuItemId: parentMenuItem.id,
      menuItemSizeId: parentMenuItem.validSizes[0].id,
      quantity: 1,
      orderedItemContainerDtos: containerDtos,
    } as UpdateOrderMenuItemDto;

    try {
      await validator.validateUpdate(parentOrderItem.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });
});
