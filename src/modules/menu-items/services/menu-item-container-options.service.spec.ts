import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
import { item_b } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerOptionsService } from './menu-item-container-options.service';
import { MenuItemService } from './menu-item.service';

describe('menu item container options service', () => {
  let testingUtil: MenuItemTestingUtil;
  let itemComponentOptionsService: MenuItemContainerOptionsService;
  let dbTestContext: DatabaseTestContext;

  let itemService: MenuItemService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);

    itemComponentOptionsService = module.get<MenuItemContainerOptionsService>(
      MenuItemContainerOptionsService,
    );
    itemService = module.get<MenuItemService>(MenuItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(itemComponentOptionsService).toBeDefined();
  });

  it('should fail to create container options', async () => {
    const dto = {} as CreateMenuItemContainerOptionsDto;

    await expect(itemComponentOptionsService.create(dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should find all container options', async () => {
    const results = await itemComponentOptionsService.findAll();
    expect(results.items.length).toEqual(2);

    testId = results.items[0].id;
    testIds = results.items.slice(0, 2).map((cat) => cat.id);
  });

  it('should find container options by id', async () => {
    const result = await itemComponentOptionsService.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should update container rules (add)', async () => {
    const toUpdate = await itemComponentOptionsService.findOne(testId);
    if (!toUpdate) {
      throw new Error('menu item components to update is null');
    }
    if (!toUpdate.containerRules) {
      throw new Error('container rules is null');
    }

    const originalCompSize = toUpdate.containerRules.length;

    const items = (await itemService.findAll({ relations: ['validSizes'] }))
      .items;
    const currentItemRules = toUpdate.containerRules.map(
      (rule) => rule.validItem.id,
    );

    const newItems = items.filter(
      (item) => !currentItemRules.find((ruleItemId) => ruleItemId === item.id),
    );

    const createCompOptionDto = {
      mode: 'create',
      createDto: {
        validMenuItemId: newItems[0].id,
        validSizeIds: newItems[0].validSizes.map((size) => size.id),
        quantity: 2,
      },
    } as NestedMenuItemContainerRuleDto;

    const theRest = toUpdate.containerRules.map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerRuleDto,
    );

    const dto = {
      containerRuleDtos: [createCompOptionDto, ...theRest],
    } as UpdateMenuItemContainerOptionsDto;

    const result = await itemComponentOptionsService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.containerRules.length).toEqual(originalCompSize + 1);
  });

  it('should update container rules (remove)', async () => {
    const toUpdate = await itemComponentOptionsService.findOne(testId);
    if (!toUpdate) {
      throw new Error('menu item components to update is null');
    }
    if (!toUpdate.containerRules) {
      throw new Error('valid components  is null');
    }
    const originalCompSize = toUpdate.containerRules.length;

    const theRest = toUpdate.containerRules.slice(1).map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerRuleDto,
    );

    const dto = {
      containerRuleDtos: theRest,
    } as UpdateMenuItemContainerOptionsDto;

    const result = await itemComponentOptionsService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.containerRules.length).toEqual(originalCompSize - 1);
  });

  it('should update container rules (modify)', async () => {
    const toUpdate = await itemComponentOptionsService.findOne(testId);
    if (!toUpdate) {
      throw new Error('menu item components to update is null');
    }
    if (!toUpdate.containerRules) {
      throw new Error('valid components  is null');
    }

    const compToModId = toUpdate.containerRules[0].id;

    const updateDtos = toUpdate.containerRules.map(
      (comp) =>
        ({
          mode: 'update',
          id: comp.id,
          updateDto: {},
        }) as NestedMenuItemContainerRuleDto,
    );

    const newItem = await itemService.findOneByName(item_b, ['validSizes']);
    if (!newItem) {
      throw new Error();
    }
    if (!newItem.validSizes) {
      throw new Error();
    }

    //updateDtos[0].validMenuItemId = newItem.id;
    //updateDtos[0].validSizeIds = [newItem.validSizes[0].id];

    updateDtos[0] = {
      mode: 'update',
      id: updateDtos[0].id,
      updateDto: {
        validMenuItemId: newItem.id,
        validSizeIds: [newItem.validSizes[0].id],
      },
    };

    const dto = {
      containerRuleDtos: updateDtos,
    } as UpdateMenuItemContainerOptionsDto;

    const result = await itemComponentOptionsService.update(testId, dto);
    expect(result).not.toBeNull();
    for (const compOption of result.containerRules) {
      if (compOption.id === compToModId) {
        expect(compOption.validItem.id).toEqual(newItem.id);
        expect(compOption.validSizes[0].id).toEqual(newItem.validSizes[0].id);
      }
    }
  });

  it('should update validQuantity', async () => {
    const toUpdate = await itemComponentOptionsService.findOne(testId);
    if (!toUpdate) {
      throw new Error('menu item components to update is null');
    }

    const dto = {
      validQuantity: 500,
    } as UpdateMenuItemContainerOptionsDto;

    const result = await itemComponentOptionsService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.validQuantity).toEqual(500);
  });

  it('should find container options by a list of ids', async () => {
    const results = await itemComponentOptionsService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
    for (const result of results) {
      expect(testIds.findIndex((id) => id === result.id)).not.toEqual(-1);
    }
  });

  it('should remove a container option', async () => {
    const removal = await itemComponentOptionsService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(itemComponentOptionsService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
