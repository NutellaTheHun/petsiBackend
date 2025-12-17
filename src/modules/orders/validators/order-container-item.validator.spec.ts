import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { MenuItemContainerOptionsService } from '../../menu-items/services/menu-item-container-options.service';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_b, item_f } from '../../menu-items/utils/constants';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItemService } from '../services/order-container-item.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemValidator } from './order-container-item.validator';

describe('order container item validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderContainerItemValidator;
  let containerService: OrderContainerItemService;
  let orderItemService: OrderMenuItemService;
  let menuItemService: MenuItemService;
  let sizeService: MenuItemSizeService;
  let optionsService: MenuItemContainerOptionsService;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    validator = module.get<OrderContainerItemValidator>(
      OrderContainerItemValidator,
    );
    containerService = module.get<OrderContainerItemService>(
      OrderContainerItemService,
    );
    orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
    menuItemService = module.get<MenuItemService>(MenuItemService);
    sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
    optionsService = module.get<MenuItemContainerOptionsService>(
      MenuItemContainerOptionsService,
    );

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
    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter(
      (item) =>
        item.containerOptions !== null && item.containerOptions !== undefined,
    );

    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }
    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }

    const dto = {
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: options?.containerRules[0].validItem.id,
      containedItemSizeId: options?.containerRules[0].validSizes[0].id,
      quantity: 1,
    } as CreateOrderContainerItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: invalid dto item for container', async () => {
    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter(
      (item) =>
        item.containerOptions !== null && item.containerOptions !== undefined,
    );

    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }
    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    const validItemIds = options?.containerRules.map(
      (item) => item.validItem.id,
    );

    const menuItems = (
      await menuItemService.findAll({ relations: ['validSizes'] })
    ).items;
    const badItems = menuItems.filter(
      (item) => !validItemIds?.includes(item.id),
    );

    const dto = {
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: badItems[0].id,
      containedItemSizeId: badItems[0].sizes[0].id,
      quantity: 1,
    } as CreateOrderContainerItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItem');
  });

  it('should fail create: invalid dto size for container', async () => {
    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter(
      (item) =>
        item.containerOptions !== null && item.containerOptions !== undefined,
    );
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const containedItem = await menuItemService.findOne(
      options.containerRules[0].validItem.id,
      ['validSizes'],
    );
    if (!containedItem) {
      throw new Error();
    }

    const validItemSizeIds = options.containerRules[0].validSizes.map(
      (size) => size.id,
    );

    const badSizes = containedItem.sizes.filter(
      (validSize) =>
        !validItemSizeIds.find(
          (optionsSizeId) => optionsSizeId === validSize.id,
        ),
    );

    const dto = {
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: containedItem.id,
      containedItemSizeId: badSizes[0].id,
      quantity: 1,
    } as CreateOrderContainerItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });

  it('should fail create: invalid dto size for dto item', async () => {
    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter(
      (item) =>
        item.containerOptions !== null && item.containerOptions !== undefined,
    );
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const containedItem = await menuItemService.findOne(
      options.containerRules[0].validItem.id,
      ['validSizes'],
    );
    if (!containedItem) {
      throw new Error();
    }

    const badItem = await menuItemService.findOneByName(item_f, ['validSizes']);
    if (!badItem) {
      throw new Error();
    }

    const dto = {
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: containedItem.id,
      containedItemSizeId: badItem.sizes[0].id,
      quantity: 1,
    } as CreateOrderContainerItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });

  it('should pass update', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter(
      (item) =>
        item.containerOptions !== null && item.containerOptions !== undefined,
    );
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const dto = {
      id: toUpdate.id,
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: options.containerRules[0].validItem.id,
      containedItemSizeId: options.containerRules[0].validSizes[0].id,
      quantity: 1,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update DTO ITEM AND SIZE: invalid dto item for container', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter((item) => item.containerOptions);
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const validItemIds = options?.containerRules.map((item) => item.id);

    const contItemB = await menuItemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!contItemB) {
      throw new Error();
    }

    const menuItems = (
      await menuItemService.findAll({ relations: ['validSizes'] })
    ).items;
    if (!menuItems) {
      throw new Error();
    }

    const badItems = menuItems.filter(
      (item) => !validItemIds?.find((validItemId) => validItemId === item.id),
    );

    const dto = {
      id: toUpdate.id,
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: badItems[0].id,
      containedItemSizeId: badItems[0].sizes[0].id,
      quantity: 1,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItem');
  });

  it('should fail update DTO ITEM AND SIZE: invalid dto size for container', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter((item) => item.containerOptions);
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const containedItem = await menuItemService.findOne(
      options.containerRules[0].validItem.id,
      ['validSizes'],
    );
    if (!containedItem) {
      throw new Error();
    }

    const validItemSizeIds = options.containerRules[0].validSizes.map(
      (item) => item.id,
    );

    const badSizes = containedItem.sizes.filter(
      (validSize) =>
        !validItemSizeIds.find(
          (optionsSizeId) => optionsSizeId === validSize.id,
        ),
    );

    const dto = {
      id: toUpdate.id,
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: containedItem.id,
      containedItemSizeId: badSizes[0].id,
      quantity: 1,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });

  it('should fail update DTO ITEM AND SIZE: invalid dto size for dto item', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter((item) => item.containerOptions);
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const containedItem = await menuItemService.findOne(
      options.containerRules[0].validItem.id,
      ['validSizes'],
    );
    if (!containedItem) {
      throw new Error();
    }

    const badItem = await menuItemService.findOneByName(item_f, ['validSizes']);
    if (!badItem) {
      throw new Error();
    }

    const dto = {
      id: toUpdate.id,
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: containedItem.id,
      containedItemSizeId: badItem.sizes[0].id,
      quantity: 1,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });

  it('should fail update DTO ITEM: invalid dto item for CURRENT size', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem', 'containedItemSize'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter((item) => item.containerOptions);
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const itemsRequest = await menuItemService.findAll({
      relations: ['validSizes'],
    });
    if (!itemsRequest) {
      throw new Error();
    }

    const badItems = itemsRequest.items.filter(
      (item) =>
        !item.sizes.find((size) => size.id === toUpdate.containedItemSize.id),
    );

    const dto = {
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: badItems[0].id,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItem');
  });

  it('should fail update DTO ITEM: invalid dto item for container', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem', 'containedItemSize'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter((item) => item.containerOptions);
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const validItemIds = options.containerRules.map(
      (rule) => rule.validItem.id,
    );

    const menuItems = (
      await menuItemService.findAll({ relations: ['validSizes'] })
    ).items;
    if (!menuItems) {
      throw new Error();
    }

    const badItems = menuItems.filter(
      (item) => !validItemIds?.find((validItemId) => validItemId === item.id),
    );

    const dto = {
      id: toUpdate.id,
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedMenuItemId: badItems[0].id,
      containedItemSizeId: badItems[0].sizes[0].id,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItem');
  });

  it('should fail update DTO SIZE: invalid DTO size with CURRENT item', async () => {
    const containerItemRequest = await containerService.findAll({
      relations: ['parentOrderItem', 'containedItemSize', 'containedItem'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0];

    const items = (
      await menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;

    const itemsWithOptions = items.filter((item) => item.containerOptions);
    if (!itemsWithOptions[0].containerOptions) {
      throw new Error();
    }

    const options = await optionsService.findOne(
      itemsWithOptions[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }
    if (!options?.containerRules) {
      throw new Error();
    }

    const rule = options.containerRules.find(
      (rule) => rule.validItem.id === toUpdate.containedMenuItem.id,
    );
    if (!rule) {
      throw new Error();
    }

    const currentItem = await menuItemService.findOne(
      toUpdate.containedMenuItem.id,
      ['validSizes'],
    );
    if (!currentItem) {
      throw new Error();
    }

    // sizes that are in validSizes but not in rule.validSizes
    const badSizes = currentItem.sizes.filter(
      (validSize) =>
        !rule.validSizes.some((ruleSize) => ruleSize.id === validSize.id),
    );

    const dto = {
      id: toUpdate.id,
      parentContainerMenuItemId: itemsWithOptions[0].id,
      containedItemSizeId: badSizes[0].id,
    } as UpdateOrderContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });
});
