import { NotImplementedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b, item_c } from '../../menu-items/utils/constants';
import { NestedOrderContainerItemDto } from '../dto/order-container-item/nested-order-container-item.dto';
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
      plainToInstance(NestedOrderContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerMenuItemId: item.id,
          containedMenuItemId: contItemB.id,
          containedMenuItemSizeId: contItemB.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerMenuItemId: item.id,
          containedMenuItemId: contItemC.id,
          containedMenuItemSizeId: contItemC.sizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      menuItemId: item.id,
      sizeId: item.sizes[0].id,
      quantity: 1,
      containerOrderMenuItems: containerDtos,
    } as CreateOrderMenuItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: invalid dto size for dto item', async () => {
    const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const sizes = (await sizeService.findAll()).items;

    const badSizes = sizes.filter(
      (size) => !itemA.sizes.find((validSize) => validSize.id === size.id),
    );
    const dto = {
      menuItemId: itemA.id,
      sizeId: badSizes[0].id,
      quantity: 1,
    } as CreateOrderMenuItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('size');
  });

  it('should fail create: nested container item validator', async () => {
    throw new NotImplementedException();
  });

  it('should pass update', async () => {
    const containerItems = (
      await orderContainerservice.findAll({ relations: ['parentOrderItem'] })
    ).items;

    const parentOrderItem = await orderItemservice.findOne(
      containerItems[0].parentOrderMenuItem.id,
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
      plainToInstance(NestedOrderContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerMenuItemId: parentMenuItem.id,
          containedMenuItemId: contItemB.id,
          containedMenuItemSizeId: contItemB.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedOrderContainerItemDto, {
        mode: 'update',
        id: containerItems[0].id,
        updateDto: {
          parentContainerMenuItemId: parentMenuItem.id,
          containedMenuItemId: contItemC.id,
          containedMenuItemSizeId: contItemC.sizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      id: parentOrderItem.id,
      menuItemId: parentMenuItem.id,
      sizeId: parentMenuItem.sizes[0].id,
      quantity: 1,
      containerOrderMenuItems: containerDtos,
    } as UpdateOrderMenuItemDto;

    const result = await validator.validateUpdateNode(
      'root',
      dto,
      parentOrderItem.id,
    );
    expect(result).toBeNull();
  });

  it('should fail update, invalid size', async () => {
    throw new NotImplementedException();
  });

  it('should fail update: nested containerItem validator', async () => {
    throw new NotImplementedException();
  });
});
