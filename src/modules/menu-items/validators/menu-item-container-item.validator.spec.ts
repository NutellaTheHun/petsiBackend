import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemService } from '../services/menu-item.service';
import { item_a, item_c, SIZE_FOUR } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

describe('menu item container item validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: MenuItemContainerItemValidator;
  let containerService: MenuItemContainerItemService;
  let itemService: MenuItemService;
  let sizeService: MenuItemSizeService;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    validator = module.get<MenuItemContainerItemValidator>(
      MenuItemContainerItemValidator,
    );
    containerService = module.get<MenuItemContainerItemService>(
      MenuItemContainerItemService,
    );
    itemService = module.get<MenuItemService>(MenuItemService);
    sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const parentContainer = await itemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!parentContainer) {
      throw new Error();
    }

    const containedItem = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItem) {
      throw new Error();
    }

    const dto = {
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: 1,
    } as CreateMenuItemContainerItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: invalid size for item', async () => {
    const parentContainer = await itemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!parentContainer) {
      throw new Error();
    }

    const containedItem = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItem) {
      throw new Error();
    }

    const badSize = await sizeService.findOneByName(SIZE_FOUR);
    if (!badSize) {
      throw new Error();
    }

    const dto = {
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
      containedMenuItemId: containedItem.id,
      containedItemSizeId: badSize.id,
      quantity: 1,
    } as CreateMenuItemContainerItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });

  it('should pass update', async () => {
    const toUpdateRequest = await containerService.findAll();
    if (!toUpdateRequest) {
      throw new Error();
    }

    const toUpdate = toUpdateRequest.items[0];

    const parentContainer = await itemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!parentContainer) {
      throw new Error();
    }

    const containedItem = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItem) {
      throw new Error();
    }

    const dto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: 2,
    } as UpdateMenuItemContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: invalid contained item and size', async () => {
    const toUpdateRequest = await containerService.findAll();
    if (!toUpdateRequest) {
      throw new Error();
    }

    const toUpdate = toUpdateRequest.items[0];

    const containedItem = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItem) {
      throw new Error();
    }

    const badSize = await sizeService.findOneByName(SIZE_FOUR);
    if (!badSize) {
      throw new Error();
    }

    const dto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: badSize.id,
      quantity: 3,
    } as UpdateMenuItemContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });

  it('should fail update: invalid size for currentItem', async () => {
    const toUpdateRequest = await containerService.findAll({
      relations: ['containedItem'],
    });
    if (!toUpdateRequest) {
      throw new Error();
    }

    const toUpdate = toUpdateRequest.items[0];

    const containedItem = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItem) {
      throw new Error();
    }

    const badSize = await sizeService.findOneByName(SIZE_FOUR);
    if (!badSize) {
      throw new Error();
    }

    const dto = {
      containedItemSizeId: badSize.id,
      quantity: 3,
    } as UpdateMenuItemContainerItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containedItemSize');
  });
});
