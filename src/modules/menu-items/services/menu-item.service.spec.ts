import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import {
  CAT_BLUE,
  CAT_GREEN,
  CAT_RED,
  item_a,
  item_b,
  item_c,
  item_d,
  item_f,
  item_g,
} from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryService } from './menu-item-category.service';
import { MenuItemContainerItemService } from './menu-item-container-item.service';
import { MenuItemSizeService } from './menu-item-size.service';
import { MenuItemService } from './menu-item.service';

describe('menu item service', () => {
  let testingUtil: MenuItemTestingUtil;
  let itemService: MenuItemService;
  let dbTestContext: DatabaseTestContext;

  let categoryService: MenuItemCategoryService;
  let sizeService: MenuItemSizeService;
  let containerItemService: MenuItemContainerItemService;

  let testId: number;
  let testIds: number[];
  let deletedValidSizeId: number;
  let veganTakeNBakeId: number;
  let takeNBakeId: number;
  let veganId: number;

  let containerMenuItemTestId: number;
  let containerComponentModifyTestId: number;
  let compIds: number[];
  //let menuItemCompTestId: number;
  //let menuItemCompOptionsTestId: number;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    itemService = module.get<MenuItemService>(MenuItemService);
    categoryService = module.get<MenuItemCategoryService>(
      MenuItemCategoryService,
    );
    sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
    containerItemService = module.get<MenuItemContainerItemService>(
      MenuItemContainerItemService,
    );
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(itemService).toBeDefined();
  });

  it('should create a menuItem', async () => {
    const dto = {
      name: 'testItem',
    } as CreateMenuItemDto;

    const result = await itemService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testItem');

    testId = result?.id as number;
  });

  it('should find a menuItem by id', async () => {
    const result = await itemService.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual('testItem');
  });

  it('should find a menuItem by name', async () => {
    const result = await itemService.findOneByName('testItem');

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual('testItem');
  });

  it('should update name', async () => {
    const dto = {
      name: 'updateTestName',
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
  });

  it('should update category', async () => {
    const category = await categoryService.findOneByName(CAT_RED);
    if (!category) {
      throw new NotFoundException();
    }

    const dto = {
      categoryId: category.id,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category?.id).toEqual(category.id);
    expect(result.category?.name).toEqual(CAT_RED);
  });

  it('should add reference to category', async () => {
    const category = await categoryService.findOneByName(CAT_RED, [
      'menuItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.menuItems?.findIndex((item) => item.id === testId),
    ).not.toEqual(-1);
  });

  it('should change category', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new NotFoundException();
    }

    const dto = {
      categoryId: category.id,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category?.id).toEqual(category.id);
    expect(result.category?.name).toEqual(CAT_BLUE);
  });

  it('should lose reference to old category', async () => {
    const category = await categoryService.findOneByName(CAT_RED, [
      'menuItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(category.menuItems?.findIndex((item) => item.id === testId)).toEqual(
      -1,
    );
  });

  it('should gain reference to new category', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE, [
      'menuItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.menuItems?.findIndex((item) => item.id === testId),
    ).not.toEqual(-1);
  });

  it('should set to no category', async () => {
    const dto = {
      categoryId: null,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category).toBeNull();
  });

  it('should lose reference to previous category', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE, [
      'menuItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(category.menuItems?.findIndex((item) => item.id === testId)).toEqual(
      -1,
    );
  });

  it('should update sizes (add)', async () => {
    const sizesRequest = await sizeService.findAll();
    const sizes = sizesRequest.items;
    if (!sizes) {
      throw new Error();
    }

    const dto = {
      sizeIds: sizes.map((size) => size.id),
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category).toBeNull();
    expect(result.sizes?.length).toEqual(4);
  });

  it('should update sizes (remove)', async () => {
    const sizesRequest = await sizeService.findAll();
    const sizes = sizesRequest.items;
    if (!sizes) {
      throw new Error();
    }

    const reducedSizes = sizes.slice(0, 3).map((size) => size.id);
    deletedValidSizeId = sizes[3].id;

    const dto = {
      sizeIds: reducedSizes,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category).toBeNull();
    expect(result.sizes?.length).toEqual(3);
    expect(
      result.sizes?.findIndex((size) => size.id === deletedValidSizeId),
    ).toEqual(-1);
  });

  it('should update menuItemComponent (add)', async () => {
    const containerItem = await itemService.findOneByName(item_c, ['sizes']);
    if (!containerItem) {
      throw new NotFoundException();
    }
    if (!containerItem.sizes) {
      throw new Error();
    }

    const containerItemA = await itemService.findOneByName(item_a, ['sizes']);
    if (!containerItemA) {
      throw new Error();
    }
    if (!containerItemA.sizes) {
      throw new Error();
    }

    const containerItemB = await itemService.findOneByName(item_b, ['sizes']);
    if (!containerItemB) {
      throw new Error();
    }
    if (!containerItemB.sizes) {
      throw new Error();
    }

    const compDtos = [
      plainToInstance(NestedCreateMenuItemContainerItemDto, {
        createId: 'c1',
        containedMenuItemId: containerItemA.id,
        containedMenuItemSizeId: containerItemA.sizes[0].id,
        quantity: 1,
      }),
      plainToInstance(NestedCreateMenuItemContainerItemDto, {
        createId: 'c2',
        containedMenuItemId: containerItemB.id,
        containedMenuItemSizeId: containerItemB.sizes[0].id,
        quantity: 1,
      }),
    ];

    const uDto = {
      containerMenuItems: compDtos,
    } as UpdateMenuItemDto;

    const result = await itemService.update(containerItem.id, uDto);
    if (!result) {
      throw new Error();
    }
    if (!result.containerMenuItems) {
      throw new Error();
    }
    expect(result).not.toBeNull();

    containerMenuItemTestId = result.id;
    compIds = result.containerMenuItems.map((comp) => comp.id);
  });

  it('should query the created menuItemComponents', async () => {
    const components = await containerItemService.findEntitiesById(compIds);
    expect(components.length).toEqual(2);
  });

  it('should update menuItems container components, (modify)', async () => {
    const containerItem = await itemService.findOneByName(item_c, [
      'containerMenuItems',
    ]);
    if (!containerItem) {
      throw new NotFoundException();
    }
    if (!containerItem.containerMenuItems) {
      throw new NotFoundException();
    }

    const compDto = plainToInstance(NestedUpdateMenuItemContainerItemDto, {
      id: containerItem.containerMenuItems[0].id,
      quantity: 50,
    });

    containerComponentModifyTestId = containerItem.containerMenuItems[0].id;

    const theRest = containerItem.containerMenuItems.slice(1).map((comp) =>
      plainToInstance(NestedUpdateMenuItemContainerItemDto, {
        id: comp.id,
        quantity: 50,
      }),
    );

    const uDto = {
      containerMenuItems: [compDto, ...theRest],
    } as UpdateMenuItemDto;

    const result = await itemService.update(containerItem.id, uDto);
    if (!result) {
      throw new Error();
    }
    if (!result.containerMenuItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    for (const comp of result?.containerMenuItems) {
      if (comp.id === containerComponentModifyTestId) {
        expect(comp.quantity).toEqual(50);
      }
    }
  });

  it('should update menuItems container components, (delete)', async () => {
    const containerItem = await itemService.findOneByName(item_c, [
      'containerMenuItems',
    ]);
    if (!containerItem) {
      throw new NotFoundException();
    }
    if (!containerItem.containerMenuItems) {
      throw new NotFoundException();
    }

    const theRest = containerItem.containerMenuItems.slice(1).map((comp) =>
      plainToInstance(NestedUpdateMenuItemContainerItemDto, {
        id: comp.id,
      }),
    );

    const uDto = {
      containerMenuItems: theRest,
    } as UpdateMenuItemDto;

    const result = await itemService.update(containerItem.id, uDto);
    if (!result) {
      throw new Error();
    }
    if (!result.containerMenuItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result.containerMenuItems.length).toEqual(1);
  });

  it('should retain all updated properties', async () => {
    const item = await itemService.findOne(testId, ['category']);
    if (!item) {
      throw new NotFoundException();
    }

    expect(item).not.toBeNull();
    expect(item?.name).toEqual('updateTestName');
    expect(item.category).toBeNull();
    expect(item.sizes?.length).toEqual(3);
    expect(
      item.sizes?.findIndex((size) => size.id === deletedValidSizeId),
    ).toEqual(-1);
  });

  it('should find all menuItems', async () => {
    const results = await itemService.findAll();
    if (!results) {
      throw new Error();
    }

    testIds = results.items.slice(0, 3).map((item) => item.id);

    expect(results.items.length).toEqual(10);
  });

  it('should sort all menuItems by itemName', async () => {
    const results = await itemService.findAll({ sortBy: 'name' });
    if (!results) {
      throw new Error();
    }
  });

  it('should sort all menuItems by category', async () => {
    const results = await itemService.findAll({ sortBy: 'category' });
    if (!results) {
      throw new Error();
    }
  });

  it('should find all menuItems with search term', async () => {
    const results = await itemService.findAll({
      search: 'item',
      relations: ['category'],
    });
    if (!results) {
      throw new Error();
    }

    expect(results.items.length).toEqual(7);
  });

  it('should find all menuItems with filter', async () => {
    const catRed = await categoryService.findOneByName(CAT_RED);
    if (!catRed) {
      throw new Error();
    }
    const results = await itemService.findAll({
      filters: [`category=${catRed.id}`],
      relations: ['category'],
    });

    if (!results) {
      throw new Error();
    }

    expect(results.items.length).toEqual(3);
  });

  it('should filter and search', async () => {
    const catRed = await categoryService.findOneByName(CAT_RED);
    if (!catRed) {
      throw new Error();
    }

    const results = await itemService.findAll({
      search: 'container',
      filters: [`category=${catRed.id}`],
      relations: ['category'],
    });

    if (!results) {
      throw new Error();
    }

    expect(results.items.length).toEqual(1);
  });

  it('should find menuItems by list of ids', async () => {
    const results = await itemService.findEntitiesById(testIds);
    if (!results) {
      throw new Error();
    }

    expect(results.length).toEqual(3);
  });

  it('should remove veganOption', async () => {
    const dto = {
      veganOptionMenuId: null,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new NotFoundException();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category).toBeNull();
  });

  it('should remove takeNBakeOption', async () => {
    const dto = {
      takeNBakeOptionMenuId: null,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new NotFoundException();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category).toBeNull();
  });

  it('should remove veganTakeNBakeOption', async () => {
    const dto = {
      veganTakeNBakeOptionMenuId: null,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new NotFoundException();
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('updateTestName');
    expect(result.category).toBeNull();
  });

  it('should remove menu item', async () => {
    const category = await categoryService.findOneByName(CAT_GREEN);
    if (!category) {
      throw new NotFoundException();
    }

    const dto = {
      categoryId: category.id,
    } as UpdateMenuItemDto;

    await itemService.update(testId, dto);

    const removal = await itemService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(itemService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should remove refence from category', async () => {
    const category = await categoryService.findOneByName(CAT_GREEN, [
      'menuItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(category.menuItems?.findIndex((item) => item.id === testId)).toEqual(
      -1,
    );
  });

  it('should create a menuItem with menuItem Components', async () => {
    const sizeRequest = await sizeService.findAll();
    if (!sizeRequest) {
      throw new Error();
    }
    const sizes = sizeRequest.items;

    const itemC = await itemService.findOneByName(item_c, ['sizes']);
    if (!itemC) {
      throw new Error();
    }
    if (!itemC.sizes) {
      throw new Error();
    }
    const itemD = await itemService.findOneByName(item_d, ['sizes']);
    if (!itemD) {
      throw new Error();
    }
    if (!itemD.sizes) {
      throw new Error();
    }
    const compDtos = [
      plainToInstance(NestedCreateMenuItemContainerItemDto, {
        createId: 'c1',
        containedMenuItemId: itemC.id,
        containedMenuItemSizeId: itemC.sizes[0].id,
        quantity: 3,
      }),
      plainToInstance(NestedCreateMenuItemContainerItemDto, {
        createId: 'c2',
        containedMenuItemId: itemD.id,
        containedMenuItemSizeId: itemD.sizes[0].id,
        quantity: 3,
      }),
    ];

    const dto = {
      name: 'containerMenuItem',
      sizeIds: sizes.map((size) => size.id),
      containerMenuItems: compDtos,
    } as CreateMenuItemDto;

    const result = await itemService.create(dto);
    if (!result) {
      throw new Error('create result is null');
    }
    if (!result.containerMenuItems) {
      throw new Error('container is null');
    }
    expect(result.containerMenuItems?.length).toEqual(2);
    for (const containedItem of result.containerMenuItems) {
      if (containedItem.containedMenuItem.id === itemC.id) {
        expect(containedItem.quantity).toEqual(3);
        expect(containedItem.containedItemSize.id).toEqual(itemC.sizes[0].id);
        expect(containedItem.parentMenuItem.id).toEqual(result.id);
      }
      if (containedItem.containedMenuItem.id === itemD.id) {
        expect(containedItem.quantity).toEqual(3);
        expect(containedItem.containedItemSize.id).toEqual(itemD.sizes[0].id);
        expect(containedItem.parentMenuItem.id).toEqual(result.id);
      }
    }

    containerMenuItemTestId = result.id;
  });

  it("should update menuItem's container items (add item)", async () => {
    const itemToUpdate = await itemService.findOne(containerMenuItemTestId, [
      'containerMenuItems',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.containerMenuItems) {
      throw new Error();
    }

    const origContainerSize = itemToUpdate.containerMenuItems.length;

    const sizeRequest = await sizeService.findAll();
    if (!sizeRequest) {
      throw new Error();
    }
    const sizes = sizeRequest.items;

    const itemG = await itemService.findOneByName(item_g, ['sizes']);
    if (!itemG) {
      throw new Error();
    }
    if (!itemG.sizes) {
      throw new Error();
    }

    const createCompDto = plainToInstance(
      NestedCreateMenuItemContainerItemDto,
      {
        createId: 'c1',
        containedMenuItemId: itemG.id,
        containedMenuItemSizeId: itemG.sizes[0].id,
        quantity: 3,
      },
    );

    const theRest = itemToUpdate.containerMenuItems.map((cItem) =>
      plainToInstance(NestedUpdateMenuItemContainerItemDto, {
        id: cItem.id,
      }),
    );

    const updateItemDto = {
      containerMenuItems: [createCompDto, ...theRest],
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      containerMenuItemTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.containerMenuItems) {
      throw new Error();
    }
    expect(result.containerMenuItems.length).toEqual(origContainerSize + 1);
  });

  it("should update menuItem's container items (modify item)", async () => {
    const itemToUpdate = await itemService.findOne(containerMenuItemTestId, [
      'containerMenuItems',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.containerMenuItems) {
      throw new Error();
    }

    const compToModifyId = itemToUpdate.containerMenuItems[0].id;

    const itemF = await itemService.findOneByName(item_f, ['sizes']);
    if (!itemF) {
      throw new Error();
    }
    if (!itemF.sizes) {
      throw new Error();
    }

    const updateCompDto = plainToInstance(
      NestedUpdateMenuItemContainerItemDto,
      {
        id: compToModifyId,
        quantity: 5,
        containedMenuItemId: itemF.id,
        containedMenuItemSizeId: itemF.sizes[0].id,
      },
    );

    const theRest = itemToUpdate.containerMenuItems
      .slice(1, itemToUpdate.containerMenuItems.length)
      .map((cItem) =>
        plainToInstance(NestedUpdateMenuItemContainerItemDto, {
          id: cItem.id,
        }),
      );

    const updateItemDto = {
      containerMenuItems: [updateCompDto, ...theRest],
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      containerMenuItemTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.containerMenuItems) {
      throw new Error();
    }
    for (const comp of result.containerMenuItems) {
      if (comp.id === compToModifyId) {
        expect(comp.containedMenuItem.id).toEqual(itemF.id);
        expect(comp.containedItemSize.id).toEqual(itemF.sizes[0].id);
        expect(comp.quantity).toEqual(5);
      }
    }
  });

  it("should update menuItem's container items (remove item)", async () => {
    const itemToUpdate = await itemService.findOne(containerMenuItemTestId, [
      'containerMenuItems',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.containerMenuItems) {
      throw new Error();
    }

    const origContainerSize = itemToUpdate.containerMenuItems.length;
    const removedCompId = itemToUpdate.containerMenuItems[0].id;

    const theRest = itemToUpdate.containerMenuItems.slice(1).map((cItem) =>
      plainToInstance(NestedUpdateMenuItemContainerItemDto, {
        id: cItem.id,
      }),
    );

    const updateItemDto = {
      containerMenuItems: theRest,
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      containerMenuItemTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.containerMenuItems) {
      throw new Error();
    }

    expect(result.containerMenuItems.length).toEqual(origContainerSize - 1);

    await expect(containerItemService.findOne(removedCompId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
