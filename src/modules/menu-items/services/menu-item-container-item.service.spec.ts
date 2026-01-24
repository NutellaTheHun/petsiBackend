import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_c, item_e, item_f, item_g } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerItemService } from './menu-item-container-item.service';

class TestableMenuItemContainerItemService extends MenuItemContainerItemService {
  async createEntityForTest(
    dto: CreateMenuItemContainerItemDto,
    manager: EntityManager,
  ): Promise<MenuItemContainerItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateMenuItemContainerItemDto,
    entity: MenuItemContainerItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('menu item container item service', () => {
  let testingUtil: MenuItemTestingUtil;
  let containerItemService: MenuItemContainerItemService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let menuItemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule({
      menuItemContainerItemServiceClass: TestableMenuItemContainerItemService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);

    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    dataSource = module.get(DataSource);

    containerItemService = module.get(
      MenuItemContainerItemService,
    ) as TestableMenuItemContainerItemService;

    menuItemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(menuItemService).toBeDefined();
  });

  it('should fail to create a container item (bad request) then create properly for tests.', async () => {
    const parent = await menuItemService.findOneByName(item_a, ['sizes']);
    if (!parent) {
      throw new NotFoundException();
    }
    if (!parent.sizes) {
      throw new Error();
    }

    const item = await menuItemService.findOneByName(item_e, ['sizes']);
    if (!item) {
      throw new NotFoundException();
    }
    if (!item.sizes) {
      throw new Error();
    }
    /*const dto = {
      mode: 'create',
      parentContainerId: parent.id,
      parentContainerSizeId: parent.validSizes[0].id,
      containedMenuItemId: item.id,
      containedMenuItemSizeId: item.validSizes[0].id,
      quantity: 1,
    } as CreateMenuItemContainerItemDto;

    await expect(componentService.create(dto)).rejects.toThrow();*/

    const definedContainerDto = plainToInstance(
      NestedCreateMenuItemContainerItemDto,
      {
        createId: 'c1',
        parentContainerSizeId: parent.sizes[0].id,
        containedMenuItemId: item.id,
        containedMenuItemSizeId: item.sizes[0].id,
        quantity: 1,
      },
    );

    const updateItemDto = {
      definedContainerItemDtos: [definedContainerDto],
    } as UpdateMenuItemDto;

    const updateResult = await menuItemService.update(parent.id, updateItemDto);
    if (!updateResult) {
      throw new Error();
    }
    if (!updateResult.containerMenuItems) {
      throw new Error();
    }

    const result = updateResult.containerMenuItems[0];

    expect(result).not.toBeNull();

    testId = result?.id as number;
    testParentItemId = result?.parentMenuItem.id as number;
  });

  it('should query menu item with container item reference', async () => {
    const parentItem = await menuItemService.findOne(testParentItemId, [
      'containerMenuItems',
    ]);
    if (!parentItem) {
      throw new NotFoundException();
    }
    if (!parentItem.containerMenuItems) {
      throw new Error();
    }

    expect(
      parentItem.containerMenuItems.findIndex((comp) => comp.id === testId),
    ).not.toEqual(-1);
  });

  it('should find one container item by id', async () => {
    const result = await containerItemService.findOne(testId);

    expect(result).not.toBeNull();
  });

  it('should update containedItem', async () => {
    const newItem = await menuItemService.findOneByName(item_f, ['sizes']);
    if (!newItem) {
      throw new NotFoundException();
    }
    if (!newItem.sizes) {
      throw new Error();
    }

    const dto = {
      mode: 'update',
      containedMenuItemId: newItem.id,
      containedItemSizeId: newItem.sizes[0].id,
    } as UpdateMenuItemContainerItemDto;

    const result = await containerItemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }
    if (!result.containedMenuItem) {
      throw new Error();
    }
    if (!result.containedItemSize) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.containedMenuItem.id).toEqual(newItem.id);
    expect(result?.containedItemSize.id).toEqual(newItem.sizes[0].id);
  });

  it('should update contained item size', async () => {
    const item = await menuItemService.findOneByName(item_f, ['sizes']);
    if (!item) {
      throw new NotFoundException();
    }
    if (!item.sizes) {
      throw new Error();
    }

    const dto = {
      mode: 'update',
      containedItemSizeId: item.sizes[1].id,
    } as UpdateMenuItemContainerItemDto;

    const result = await containerItemService.update(testId, dto);
    if (!result) {
      throw new Error();
    }
    if (!result.containedItemSize) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result?.containedItemSize.id).toEqual(item.sizes[1].id);
  });

  it('should update quantity', async () => {
    const dto = {
      mode: 'update',
      quantity: 20,
    } as UpdateMenuItemContainerItemDto;

    const result = await containerItemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.quantity).toEqual(20);
  });

  it('should find all container items', async () => {
    const results = await containerItemService.findAll();

    expect(results.items.length).toBeGreaterThan(0);

    testIds = results.items.slice(0, 2).map((item) => item.id);
  });

  it('should find all container items', async () => {
    const results = await containerItemService.findAll({
      sortBy: 'containedItem',
    });

    expect(results.items.length).toBeGreaterThan(0);
  });

  it('should get container items by list of ids', async () => {
    const results = await containerItemService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(2);
  });

  it('should remove container item', async () => {
    const removal = await containerItemService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(containerItemService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should query menu item without container item reference', async () => {
    const parentItem = await menuItemService.findOne(testParentItemId, [
      'containerMenuItems',
    ]);
    if (!parentItem) {
      throw new NotFoundException();
    }
    if (!parentItem.containerMenuItems) {
      throw new Error();
    }

    const container = await containerItemService.findEntitiesById(
      parentItem.containerMenuItems.map((comp) => comp.id),
      ['containedMenuItem'],
    );

    expect(
      container.findIndex((comp) => comp.containedMenuItem.id === testId),
    ).toEqual(-1);
  });

  it('should delete menuItem and remove container item', async () => {
    const toDelete = await menuItemService.findOneByName(item_c);
    if (!toDelete) {
      throw new NotFoundException();
    }

    const deleteId = toDelete.id;

    await menuItemService.remove(toDelete.id);

    const parentItem = await menuItemService.findOneByName(item_g, [
      'containerMenuItems',
    ]);
    if (!parentItem) {
      throw new NotFoundException();
    }
    if (!parentItem.containerMenuItems) {
      throw new Error();
    }

    const container = await containerItemService.findEntitiesById(
      parentItem.containerMenuItems.map((comp) => comp.id),
      ['containedMenuItem'],
    );

    expect(
      container.findIndex((comp) => comp.containedMenuItem.id === deleteId),
    ).toEqual(-1);
  });
});
