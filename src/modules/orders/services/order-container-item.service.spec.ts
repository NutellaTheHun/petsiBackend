import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemService } from './order-container-item.service';
import { OrderMenuItemService } from './order-menu-item.service';

describe('order container item service', () => {
  let service: OrderContainerItemService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let menuItemService: MenuItemService;
  let orderItemService: OrderMenuItemService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

    service = module.get<OrderContainerItemService>(OrderContainerItemService);
    menuItemService = module.get<MenuItemService>(MenuItemService);
    orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /*it('should fail to create a container item', async () => {
    const dto = {} as CreateOrderContainerItemDto;

    const result = await expect(service.create(dto)).rejects.toThrow(
      BadRequestException,
    );
  });*/

  it('should find all container items', async () => {
    const results = await service.findAll();

    expect(results).not.toBeNull();

    testIds = results.items.slice(0, 3).map((type) => type.id);

    testId = results.items[0].id;
  });

  it('should sort all container items', async () => {
    const results = await service.findAll({ sortBy: 'containedMenuItem' });

    expect(results).not.toBeNull();
  });

  it('should find a container item by id', async () => {
    const result = await service.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
  });

  it('should update item', async () => {
    const toUpdate = await service.findOne(testId, ['parentOrderMenuItem']);
    if (!toUpdate) {
      throw new Error();
    }

    const parentOrderItem = await orderItemService.findOne(
      toUpdate.parentOrderMenuItem.id,
      ['menuItem'],
    );
    if (!parentOrderItem) {
      throw new Error();
    }

    const parentMenuItem = await menuItemService.findOne(
      parentOrderItem.menuItem.id,
      ['sizes', 'containerMenuItems'],
    );
    if (!parentMenuItem) {
      throw new Error();
    }
    if (!parentMenuItem.containerMenuItems) {
      throw new Error();
    }

    const dto = {
      parentContainerMenuItemId: parentMenuItem.id,
      containedMenuItemId:
        parentMenuItem.containerMenuItems[0].containedMenuItem.id,
      containedItemSizeId:
        parentMenuItem.containerMenuItems[0].containedItemSize.id,
    } as UpdateOrderContainerItemDto;

    const result = await service.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result.containedMenuItem.id).toEqual(
      parentMenuItem.containerMenuItems[0].containedMenuItem.id,
    );
    expect(result.containedItemSize.id).toEqual(
      parentMenuItem.containerMenuItems[0].containedItemSize.id,
    );
  });

  it('should update quantity', async () => {
    const dto = {
      quantity: 50,
    } as UpdateOrderContainerItemDto;

    const result = await service.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result.quantity).toEqual(50);
  });

  it('should get order container items by list of ids', async () => {
    const results = await service.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(testIds.length);
  });

  it('should remove a container item', async () => {
    const removal = await service.remove(testId);
    expect(removal).toBeTruthy();

    await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
  });
});
