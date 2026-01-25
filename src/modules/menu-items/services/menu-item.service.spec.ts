import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_f } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemService } from './menu-item.service';

class TestableMenuItemService extends MenuItemService {
  async createEntityForTest(
    dto: CreateMenuItemDto,
    manager: EntityManager,
  ): Promise<MenuItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateMenuItemDto,
    entity: MenuItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('menu item service', () => {
  let testingUtil: MenuItemTestingUtil;
  let itemService: TestableMenuItemService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let itemRepo: Repository<MenuItem>;
  let categoryRepo: Repository<MenuItemCategory>;
  let sizeRepo: Repository<MenuItemSize>;
  let containerItemRepo: Repository<MenuItemContainerItem>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule({
      menuItemServiceClass: TestableMenuItemService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);
    itemService = module.get(MenuItemService) as TestableMenuItemService;
    itemRepo = module.get(getRepositoryToken(MenuItem));
    categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(itemService).toBeDefined();
  });

  // test createEntity() of type single
  it('should create item of type single', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
    if (!cat || sizeIds.length < 2) throw new Error('fixtures not found');
    const dto: CreateMenuItemDto = {
      name: 'Single Item',
      type: MENU_ITEM_TYPES.SINGLE,
      categoryId: cat.id,
      sizeIds,
    };

    await dataSource.transaction(async (manager) => {
      const result = await itemService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.name).toEqual(dto.name);
      expect(result.type).toEqual(MENU_ITEM_TYPES.SINGLE);
    });
  });

  // test createEntity() of type container (With NestedCreateMenuItemContainerItemDto, variableMaxAmount = null)
  it('should create item of type container (With NestedCreateMenuItemContainerItemDto, variableMaxAmount = null)', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
    if (!cat || sizeIds.length < 2) throw new Error('fixtures not found');
    const containedItem = await itemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!containedItem) throw new Error('contained item not found');
    const dto: CreateMenuItemDto = {
      name: 'Container Item',
      type: MENU_ITEM_TYPES.CONTAINER,
      categoryId: cat.id,
      sizeIds,
      containerMenuItems: [
        {
          createId: 'c1',
          containedMenuItemId: containedItem.id,
          containedItemSizeId: containedItem.sizes[0].id,
          quantity: 4,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      const result = await itemService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.name).toEqual(dto.name);
      expect(result.type).toEqual(MENU_ITEM_TYPES.CONTAINER);
      expect(result.variableMaxAmount == null).toBe(true);
      expect(result.containerMenuItems).not.toBeNull();
      expect(result.containerMenuItems?.length).toBe(1);
      expect(result.containerMenuItems?.[0].id).toBeDefined();
      expect(result.containerMenuItems?.[0].quantity).toBe(4);
      expect(result.containerMenuItems?.[0].containedMenuItem.id).toBe(
        containedItem.id,
      );
      expect(result.containerMenuItems?.[0].containedItemSize.id).toBe(
        containedItem.sizes[0].id,
      );
    });
  });

  // test updateEntity() of type container with NestedUpdate (and NestedCreate if context had parentItemSizeId)
  it('should update item of type container (With NestedUpdateMenuItemContainerItemDto and NestedCreateMenuItemContainerItemDto)', async () => {
    const parent = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['containerMenuItems', 'sizes'],
    });
    if (!parent?.containerMenuItems?.length || !parent.sizes?.length)
      throw new Error('container item_f or its containerMenuItems not found');
    const containedItem = await itemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!containedItem) throw new Error('contained item not found');
    const existing = parent.containerMenuItems[0];
    const dto: UpdateMenuItemDto = {
      containerMenuItems: [
        { id: existing.id, quantity: 99 },
        {
          createId: 'c2',
          containedMenuItemId: containedItem.id,
          containedItemSizeId: containedItem.sizes[0].id,
          quantity: 5,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      await itemService.updateEntityForTest(dto, parent, manager);
    });

    const updated = await containerItemRepo.findOne({
      where: { id: existing.id },
    });
    if (!updated) throw new Error('result not found');
    expect(updated.quantity).toEqual(99);

    const updatedItem = await itemRepo.findOne({
      where: { id: parent.id },
      relations: ['containerMenuItems'],
    });
    if (!updatedItem) throw new Error('updated item not found');
    expect(updatedItem.containerMenuItems).not.toBeNull();
    // expect to find created item in containerMenuItems by seraching for containedMenuItem id, containedItemSize id, and quantity = 5
    expect(
      updatedItem.containerMenuItems?.find(
        (c) =>
          c.containedMenuItem.id === containedItem.id &&
          c.containedItemSize.id === containedItem.sizes[0].id &&
          c.quantity === 5,
      ),
    ).not.toBeNull();
  });

  // test findAll()
  it('should find all items', async () => {
    const repoResult = await itemRepo.find();
    const serviceResult = await itemService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with search by name
  it('should find all items with search by name', async () => {
    const serviceResult = await itemService.findAll({
      search: 'item',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(
      serviceResult?.items.every((i) => i.name.toLowerCase().includes('item')),
    ).toBe(true);
  });

  // test findAll() with filter by category
  it('should find all items with filter by category', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    if (!cat) throw new Error('category not found');
    const repoResult = await itemRepo.find({
      where: { category: { id: cat.id } },
    });
    const serviceResult = await itemService.findAll({
      filters: [`category=${cat.id}`],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with sort by name
  it('should find all items with sort by name', async () => {
    const repoResult = await itemRepo.find({ order: { name: 'DESC' } });
    const serviceResult = await itemService.findAll({
      sortBy: 'name',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0)
      expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
  });

  // test findAll() with sort by category
  it('should find all items with sort by category', async () => {
    const repoResult = await itemRepo.find({
      order: { category: { name: 'DESC' } },
    });
    if (!repoResult.length) throw new Error('items not found');

    const serviceResult = await itemService.findAll({
      sortBy: 'category',
      sortOrder: 'DESC',
      limit: 100,
    });
    if (!serviceResult) throw new Error('service result not found');

    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    expect(serviceResult.items.length).toEqual(repoResult.length);
    // expect first item of serviceResult and category result to be the same
    expect(serviceResult?.items[0]?.category?.id).toEqual(
      repoResult[0]?.category?.id,
    );
    // expect last item of serviceResult and category result to be the same
    expect(
      serviceResult?.items[serviceResult.items.length - 1]?.category?.id,
    ).toEqual(repoResult[repoResult.length - 1]?.category?.id);
  });

  // test findOne()
  it('should find one item', async () => {
    const [item] = await itemRepo.find({ take: 1 });
    if (!item) throw new Error('item not found');

    const serviceResult = await itemService.findOne(item.id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(item.id);
  });

  // test findOne() with relations
  it('should find one item with relations', async () => {
    const [item] = await itemRepo.find({ take: 1 });
    if (!item) throw new Error('item not found');

    const serviceResult = await itemService.findOne(item.id, [
      'category',
      'sizes',
      'containerMenuItems',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(item.id);
    expect(serviceResult?.category).toBeDefined();
    expect(serviceResult?.sizes).toBeDefined();
    expect(Array.isArray(serviceResult?.containerMenuItems)).toBe(true);
  });

  // test remove()
  it('should remove item', async () => {
    const item = await itemRepo.findOne({ where: { name: 'Single Item' } });
    if (!item) throw new Error('item not found (create "Single Item" first)');
    const id = item.id;

    const deleteResult = await itemService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(itemService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
