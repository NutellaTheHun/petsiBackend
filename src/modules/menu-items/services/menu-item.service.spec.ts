import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { NestedMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/nested-menu-item-container-options.dto';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
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
  SIZE_THREE,
  SIZE_TWO,
} from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryService } from './menu-item-category.service';
import { MenuItemContainerItemService } from './menu-item-container-item.service';
import { MenuItemContainerRuleService } from './menu-item-container-rule.service';
import { MenuItemSizeService } from './menu-item-size.service';
import { MenuItemService } from './menu-item.service';

describe('menu item service', () => {
  let testingUtil: MenuItemTestingUtil;
  let itemService: MenuItemService;
  let dbTestContext: DatabaseTestContext;

  let categoryService: MenuItemCategoryService;
  let sizeService: MenuItemSizeService;
  let componentService: MenuItemContainerItemService;

  let componentOptionService: MenuItemContainerRuleService;

  let testId: number;
  let testIds: number[];
  let deletedValidSizeId: number;
  let veganTakeNBakeId: number;
  let takeNBakeId: number;
  let veganId: number;

  let containerMenuItemTestId: number;
  let containerComponentModifyTestId: number;
  let compIds: number[];
  let menuItemCompTestId: number;
  let menuItemCompOptionsTestId: number;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);

    itemService = module.get<MenuItemService>(MenuItemService);
    categoryService = module.get<MenuItemCategoryService>(
      MenuItemCategoryService,
    );
    sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
    componentService = module.get<MenuItemContainerItemService>(
      MenuItemContainerItemService,
    );

    componentOptionService = module.get<MenuItemContainerRuleService>(
      MenuItemContainerRuleService,
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
      itemName: 'testItem',
    } as CreateMenuItemDto;

    const result = await itemService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('testItem');

    testId = result?.id as number;
  });

  it('should find a menuItem by id', async () => {
    const result = await itemService.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.itemName).toEqual('testItem');
  });

  it('should find a menuItem by name', async () => {
    const result = await itemService.findOneByName('testItem');

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.itemName).toEqual('testItem');
  });

  it('should update name', async () => {
    const dto = {
      itemName: 'updateTestName',
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
  });

  it('should update isPOTM', async () => {
    const dto = {
      isPOTM: true,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
  });

  it('should update isParBake', async () => {
    const dto = {
      isParbake: true,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
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
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category?.id).toEqual(category.id);
    expect(result.category?.categoryName).toEqual(CAT_RED);
  });

  it('should add reference to category', async () => {
    const category = await categoryService.findOneByName(CAT_RED, [
      'categoryItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.categoryItems?.findIndex((item) => item.id === testId),
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
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category?.id).toEqual(category.id);
    expect(result.category?.categoryName).toEqual(CAT_BLUE);
  });

  it('should lose reference to old category', async () => {
    const category = await categoryService.findOneByName(CAT_RED, [
      'categoryItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.categoryItems?.findIndex((item) => item.id === testId),
    ).toEqual(-1);
  });

  it('should gain reference to new category', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE, [
      'categoryItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.categoryItems?.findIndex((item) => item.id === testId),
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
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();
  });

  it('should lose reference to previous category', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE, [
      'categoryItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.categoryItems?.findIndex((item) => item.id === testId),
    ).toEqual(-1);
  });

  it('should update veganOption', async () => {
    const veganItem = await itemService.findOneByName(item_a);
    if (!veganItem) {
      throw new NotFoundException();
    }

    const dto = {
      veganOptionMenuId: veganItem?.id,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();
    expect(result.veganOption?.id).toEqual(veganItem.id);
    expect(result.veganOption?.itemName).toEqual(veganItem.itemName);

    veganId = result.veganOption?.id as number;
  });

  it('should update takeNBakeOption', async () => {
    const takeNBakeItem = await itemService.findOneByName(item_b);
    if (!takeNBakeItem) {
      throw new NotFoundException();
    }

    const dto = {
      takeNBakeOptionMenuId: takeNBakeItem.id,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();
    expect(result.takeNBakeOption?.id).toEqual(takeNBakeItem.id);
    expect(result.takeNBakeOption?.itemName).toEqual(takeNBakeItem.itemName);

    takeNBakeId = result.takeNBakeOption?.id as number;
  });

  it('should update veganTakeNBakeOption', async () => {
    const veganTakeNBakeItem = await itemService.findOneByName(item_c);
    if (!veganTakeNBakeItem) {
      throw new NotFoundException();
    }

    const dto = {
      veganTakeNBakeOptionMenuId: veganTakeNBakeItem.id,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();
    expect(result.veganTakeNBakeOption?.id).toEqual(veganTakeNBakeItem.id);
    expect(result.veganTakeNBakeOption?.itemName).toEqual(
      veganTakeNBakeItem.itemName,
    );

    veganTakeNBakeId = result.veganTakeNBakeOption?.id as number;
  });

  it('should update validSizes (add)', async () => {
    const sizesRequest = await sizeService.findAll();
    const sizes = sizesRequest.items;
    if (!sizes) {
      throw new Error();
    }

    const dto = {
      validSizeIds: sizes.map((size) => size.id),
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();
    expect(result.validSizes?.length).toEqual(4);
  });

  it('should update validSizes (remove)', async () => {
    const sizesRequest = await sizeService.findAll();
    const sizes = sizesRequest.items;
    if (!sizes) {
      throw new Error();
    }

    const reducedSizes = sizes.slice(0, 3).map((size) => size.id);
    deletedValidSizeId = sizes[3].id;

    const dto = {
      validSizeIds: reducedSizes,
    } as UpdateMenuItemDto;

    const result = await itemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();
    expect(result.validSizes?.length).toEqual(3);
    expect(
      result.validSizes?.findIndex((size) => size.id === deletedValidSizeId),
    ).toEqual(-1);
  });

  it('should update menuItemComponent (add)', async () => {
    const containerItem = await itemService.findOneByName(item_c, [
      'validSizes',
    ]);
    if (!containerItem) {
      throw new NotFoundException();
    }
    if (!containerItem.validSizes) {
      throw new Error();
    }

    const compItemA = await itemService.findOneByName(item_a, ['validSizes']);
    if (!compItemA) {
      throw new Error();
    }
    if (!compItemA.validSizes) {
      throw new Error();
    }

    const compItemB = await itemService.findOneByName(item_b, ['validSizes']);
    if (!compItemB) {
      throw new Error();
    }
    if (!compItemB.validSizes) {
      throw new Error();
    }

    const compDtos = [
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: containerItem.validSizes[0].id,
          containedMenuItemId: compItemA.id,
          containedMenuItemSizeId: compItemA.validSizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: containerItem.validSizes[0].id,
          containedMenuItemId: compItemB.id,
          containedMenuItemSizeId: compItemB.validSizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const uDto = {
      definedContainerItemDtos: compDtos,
    } as UpdateMenuItemDto;

    const result = await itemService.update(containerItem.id, uDto);
    if (!result) {
      throw new Error();
    }
    if (!result.definedContainerItems) {
      throw new Error();
    }
    expect(result).not.toBeNull();

    containerMenuItemTestId = result.id;
    compIds = result.definedContainerItems.map((comp) => comp.id);
  });

  it('should query the created menuItemComponents', async () => {
    const components = await componentService.findEntitiesById(compIds);
    expect(components.length).toEqual(2);
  });

  it('should update menuItems container components, (modify)', async () => {
    const containerItem = await itemService.findOneByName(item_c, [
      'definedContainerItems',
    ]);
    if (!containerItem) {
      throw new NotFoundException();
    }
    if (!containerItem.definedContainerItems) {
      throw new NotFoundException();
    }

    const compDto = plainToInstance(NestedMenuItemContainerItemDto, {
      mode: 'update',
      id: containerItem.definedContainerItems[0].id,
      updateDto: {
        quantity: 50,
      },
    });

    containerComponentModifyTestId = containerItem.definedContainerItems[0].id;

    const theRest = containerItem.definedContainerItems.slice(1).map((comp) =>
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'update',
        id: comp.id,
        updateDto: {},
      }),
    );

    const uDto = {
      definedContainerItemDtos: [compDto, ...theRest],
    } as UpdateMenuItemDto;

    const result = await itemService.update(containerItem.id, uDto);
    if (!result) {
      throw new Error();
    }
    if (!result.definedContainerItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    for (const comp of result?.definedContainerItems) {
      if (comp.id === containerComponentModifyTestId) {
        expect(comp.quantity).toEqual(50);
      }
    }
  });

  it('should update menuItems container components, (delete)', async () => {
    const containerItem = await itemService.findOneByName(item_c, [
      'definedContainerItems',
    ]);
    if (!containerItem) {
      throw new NotFoundException();
    }
    if (!containerItem.definedContainerItems) {
      throw new NotFoundException();
    }

    const theRest = containerItem.definedContainerItems.slice(1).map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerItemDto,
    );

    const uDto = {
      definedContainerItemDtos: theRest,
    } as UpdateMenuItemDto;

    const result = await itemService.update(containerItem.id, uDto);
    if (!result) {
      throw new Error();
    }
    if (!result.definedContainerItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result.definedContainerItems.length).toEqual(1);
  });

  it('should retain all updated properties', async () => {
    const item = await itemService.findOne(testId, [
      'category',
      'takeNBakeOption',
      'validSizes',
      'veganOption',
      'veganTakeNBakeOption',
    ]);
    if (!item) {
      throw new NotFoundException();
    }

    expect(item).not.toBeNull();
    expect(item?.itemName).toEqual('updateTestName');
    expect(item.isPOTM).toBeTruthy();
    expect(item.isParbake).toBeTruthy();
    expect(item.category).toBeNull();
    expect(item.validSizes?.length).toEqual(3);
    expect(
      item.validSizes?.findIndex((size) => size.id === deletedValidSizeId),
    ).toEqual(-1);
    expect(item.veganTakeNBakeOption?.id).toEqual(veganTakeNBakeId);
    expect(item.takeNBakeOption?.id).toEqual(takeNBakeId);
    expect(item.veganOption?.id).toEqual(veganId);
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
    const results = await itemService.findAll({ sortBy: 'itemName' });
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
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();

    expect(result.veganOption).toBeNull();
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
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();

    expect(result.takeNBakeOption).toBeNull();
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
    expect(result?.itemName).toEqual('updateTestName');
    expect(result.isPOTM).toBeTruthy();
    expect(result.isParbake).toBeTruthy();
    expect(result.category).toBeNull();

    expect(result.veganTakeNBakeOption).toBeNull();
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
      'categoryItems',
    ]);
    if (!category) {
      throw new NotFoundException();
    }

    expect(
      category.categoryItems?.findIndex((item) => item.id === testId),
    ).toEqual(-1);
  });

  it('should create a menuItem with menuItem Components', async () => {
    const sizeRequest = await sizeService.findAll();
    if (!sizeRequest) {
      throw new Error();
    }
    const sizes = sizeRequest.items;

    const itemC = await itemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new Error();
    }
    if (!itemC.validSizes) {
      throw new Error();
    }
    const itemD = await itemService.findOneByName(item_d, ['validSizes']);
    if (!itemD) {
      throw new Error();
    }
    if (!itemD.validSizes) {
      throw new Error();
    }
    const compDtos = [
      {
        parentContainerSizeId: sizes[0].id,
        containedMenuItemId: itemC.id,
        containedMenuItemSizeId: itemC.validSizes[0].id,
        quantity: 3,
      } as CreateMenuItemContainerItemDto,
      {
        parentContainerSizeId: sizes[0].id,
        containedMenuItemId: itemD.id,
        containedMenuItemSizeId: itemD.validSizes[0].id,
        quantity: 3,
      } as CreateMenuItemContainerItemDto,
    ] as CreateMenuItemContainerItemDto[];

    const dto = {
      itemName: 'menuItemWithComponents',
      validSizeIds: sizes.map((size) => size.id),
      definedContainerItemDtos: compDtos,
    } as CreateMenuItemDto;

    const result = await itemService.create(dto);
    if (!result) {
      throw new Error('create result is null');
    }
    if (!result.definedContainerItems) {
      throw new Error('container is null');
    }
    expect(result.definedContainerItems?.length).toEqual(2);
    for (const component of result.definedContainerItems) {
      if (component.containedItem.id === itemC.id) {
        expect(component.quantity).toEqual(3);
        expect(component.containedItemSize.id).toEqual(itemC.validSizes[0].id);
        expect(component.parentContainer.id).toEqual(result.id);
      }
      if (component.containedItem.id === itemD.id) {
        expect(component.quantity).toEqual(3);
        expect(component.containedItemSize.id).toEqual(itemD.validSizes[0].id);
        expect(component.parentContainer.id).toEqual(result.id);
      }
    }

    menuItemCompTestId = result.id;
  });

  it("should update menuItem's menuItemComponents (add component)", async () => {
    const itemToUpdate = await itemService.findOne(menuItemCompOptionsTestId, [
      'definedContainerItems',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.definedContainerItems) {
      throw new Error();
    }

    const origContainerSize = itemToUpdate.definedContainerItems.length;

    const sizeRequest = await sizeService.findAll();
    if (!sizeRequest) {
      throw new Error();
    }
    const sizes = sizeRequest.items;

    const itemG = await itemService.findOneByName(item_g, ['validSizes']);
    if (!itemG) {
      throw new Error();
    }
    if (!itemG.validSizes) {
      throw new Error();
    }

    const createCompDto = {
      mode: 'create',
      createDto: {
        parentContainerSizeId: sizes[0].id,
        containedMenuItemId: itemG.id,
        containedMenuItemSizeId: itemG.validSizes[0].id,
        quantity: 3,
      },
    } as NestedMenuItemContainerItemDto;

    const theRest = itemToUpdate.definedContainerItems.map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerItemDto,
    );

    const updateItemDto = {
      definedContainerItemDtos: [createCompDto, ...theRest],
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      menuItemCompOptionsTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.definedContainerItems) {
      throw new Error();
    }
    expect(result.definedContainerItems.length).toEqual(origContainerSize + 1);
  });

  it("should update menuItem's menuItemComponents (modify component)", async () => {
    const itemToUpdate = await itemService.findOne(menuItemCompOptionsTestId, [
      'definedContainerItems',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.definedContainerItems) {
      throw new Error();
    }

    const compToModifyId = itemToUpdate.definedContainerItems[0].id;

    const itemF = await itemService.findOneByName(item_f, ['validSizes']);
    if (!itemF) {
      throw new Error();
    }
    if (!itemF.validSizes) {
      throw new Error();
    }

    const updateCompDto = {
      mode: 'update',
      id: compToModifyId,
      updateDto: {
        quantity: 5,
        containedMenuItemId: itemF.id,
        containedMenuItemSizeId: itemF.validSizes[0].id,
      },
    } as NestedMenuItemContainerItemDto;

    const theRest = itemToUpdate.definedContainerItems
      .slice(1, itemToUpdate.definedContainerItems.length)
      .map(
        (comp) =>
          ({
            mode: 'update',
            id: comp.id,
            updateDto: {},
          }) as NestedMenuItemContainerItemDto,
      );

    const updateItemDto = {
      definedContainerItemDtos: [updateCompDto, ...theRest],
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      menuItemCompOptionsTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.definedContainerItems) {
      throw new Error();
    }
    for (const comp of result.definedContainerItems) {
      if (comp.id === compToModifyId) {
        expect(comp.containedItem.id).toEqual(itemF.id);
        expect(comp.containedItemSize.id).toEqual(itemF.validSizes[0].id);
        expect(comp.quantity).toEqual(5);
      }
    }
  });

  it("should update menuItem's menuItemComponents (remove component)", async () => {
    const itemToUpdate = await itemService.findOne(menuItemCompOptionsTestId, [
      'definedContainerItems',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.definedContainerItems) {
      throw new Error();
    }

    const origContainerSize = itemToUpdate.definedContainerItems.length;
    const removedCompId = itemToUpdate.definedContainerItems[0].id;

    const theRest = itemToUpdate.definedContainerItems.slice(1).map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerItemDto,
    );

    const updateItemDto = {
      definedContainerItemDtos: theRest,
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      menuItemCompOptionsTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.definedContainerItems) {
      throw new Error();
    }

    expect(result.definedContainerItems.length).toEqual(origContainerSize - 1);

    await expect(componentService.findOne(removedCompId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create a menu item with component options', async () => {
    const itemA = await itemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }
    if (!itemA.validSizes) {
      throw new Error();
    }
    const itemB = await itemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }
    if (!itemB.validSizes) {
      throw new Error();
    }
    const compOptionDtos = [
      {
        validMenuItemId: itemA.id,
        validSizeIds: itemA.validSizes.map((size) => size.id),
        quantity: 3,
      } as CreateMenuItemContainerRuleDto,
      {
        validMenuItemId: itemB.id,
        validSizeIds: itemB.validSizes.map((size) => size.id),
        quantity: 3,
      } as CreateMenuItemContainerRuleDto,
    ] as CreateMenuItemContainerRuleDto[];

    const optionDto = {
      mode: 'create',
      containerRuleDtos: compOptionDtos,
      validQuantity: 6,
    } as CreateMenuItemContainerOptionsDto;

    const sizeTwo = await sizeService.findOneByName(SIZE_TWO);
    if (!sizeTwo) {
      throw new Error();
    }
    const sizeThree = await sizeService.findOneByName(SIZE_THREE);
    if (!sizeThree) {
      throw new Error();
    }

    const dto = {
      itemName: 'menuItemWithCompOptions',
      validSizeIds: [sizeTwo?.id, sizeThree?.id],
      containerOptionDto: optionDto,
    } as CreateMenuItemDto;

    const result = await itemService.create(dto);
    if (!result) {
      throw new Error('create result is null');
    }
    if (!result.containerOptions) {
      throw new Error('container options is null');
    }
    if (!result.containerOptions.containerRules) {
      throw new Error('valid components is null');
    }
    expect(result.containerOptions.parentContainer.id).toEqual(result.id);
    expect(result.containerOptions.validQuantity).toEqual(6);
    expect(result.containerOptions.containerRules.length).toEqual(2);

    menuItemCompOptionsTestId = result.id;
  });

  it("should update menuItem's componentOptions (add option)", async () => {
    const itemToUpdate = await itemService.findOne(menuItemCompOptionsTestId, [
      'containerOptions',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.containerOptions) {
      throw new Error();
    }

    const originalCompOptionslength =
      itemToUpdate.containerOptions.containerRules.length;

    const itemF = await itemService.findOneByName(item_f, ['validSizes']);
    if (!itemF) {
      throw new Error();
    }
    if (!itemF.validSizes) {
      throw new Error();
    }

    const createOptionDto = {
      mode: 'create',
      createDto: {
        validMenuItemId: itemF.id,
        validSizeIds: itemF.validSizes.map((size) => size.id),
      },
    } as NestedMenuItemContainerRuleDto;

    const theRest = itemToUpdate.containerOptions.containerRules.map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerRuleDto,
    );

    const updateItemOptionsDto = {
      mode: 'update',
      id: itemToUpdate.containerOptions.id,
      containerRuleDtos: [createOptionDto, ...theRest],
    } as NestedMenuItemContainerOptionsDto;

    const updateItemDto = {
      containerOptionDto: updateItemOptionsDto,
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      menuItemCompOptionsTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.containerOptions) {
      throw new Error();
    }
    if (!result.containerOptions.containerRules) {
      throw new Error();
    }
    expect(result.containerOptions.containerRules.length).toEqual(
      originalCompOptionslength + 1,
    );
  });

  it("should update menuItem's componentOptions (modify option)", async () => {
    const itemToUpdate = await itemService.findOne(menuItemCompOptionsTestId, [
      'containerOptions',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.containerOptions) {
      throw new Error();
    }

    const theRest = itemToUpdate.containerOptions.containerRules.map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {} as UpdateMenuItemContainerItemDto,
        }) as NestedMenuItemContainerRuleDto,
    );

    const itemC = await itemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new Error();
    }
    if (!itemC.validSizes) {
      throw new Error();
    }

    //theRest[0].updateDto.validMenuItemId = itemC.id;
    //theRest[0].updateDto.validSizeIds = itemC.validSizes.map((size) => size.id);
    theRest[0] = {
      mode: 'update',
      id: theRest[0].id,
      updateDto: {
        validMenuItemId: itemC.id,
        validSizeIds: itemC.validSizes.map((size) => size.id),
      },
    };

    const modifiedCompId = theRest[0].id;

    const updateItemOptionsDto = {
      mode: 'update',
      id: itemToUpdate.containerOptions.id,
      containerRuleDtos: theRest,
    } as NestedMenuItemContainerOptionsDto;

    const updateItemDto = {
      containerOptionDto: updateItemOptionsDto,
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      menuItemCompOptionsTestId,
      updateItemDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.containerOptions) {
      throw new Error();
    }
    if (!result.containerOptions.containerRules) {
      throw new Error();
    }
    for (const comp of result.containerOptions.containerRules) {
      if (comp.id === modifiedCompId) {
        expect(comp.validItem.id).toEqual(itemC.id);
        expect(comp.validSizes.length).toEqual(itemC.validSizes.length);
      }
    }
  });

  it("should update menuItem's componentOptions (remove option)", async () => {
    const itemToUpdate = await itemService.findOne(menuItemCompOptionsTestId, [
      'containerOptions',
    ]);
    if (!itemToUpdate) {
      throw new Error();
    }
    if (!itemToUpdate.containerOptions) {
      throw new Error();
    }

    const originalCompOptionslength =
      itemToUpdate.containerOptions.containerRules.length;

    const deletedCompId = itemToUpdate.containerOptions.containerRules[0].id;

    const theRest = itemToUpdate.containerOptions.containerRules.slice(1).map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerRuleDto,
    );

    const updateItemOptionsDto = {
      mode: 'update',
      id: itemToUpdate.containerOptions.id,
      updateDto: {
        containerRuleDtos: theRest,
      },
    } as NestedMenuItemContainerOptionsDto;

    const updateItemDto = {
      containerOptionDto: updateItemOptionsDto,
    } as UpdateMenuItemDto;

    const result = await itemService.update(
      menuItemCompOptionsTestId,
      updateItemDto,
    );
    if (!result.containerOptions) {
      throw new Error();
    }
    if (!result.containerOptions.containerRules) {
      throw new Error();
    }
    expect(result.containerOptions.containerRules.length).toEqual(
      originalCompOptionslength - 1,
    );

    await expect(componentService.findOne(deletedCompId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
