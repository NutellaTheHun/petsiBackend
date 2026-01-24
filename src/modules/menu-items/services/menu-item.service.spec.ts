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
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
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
  let itemService: MenuItemService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

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
  it('should create item of type single', async () => {});

  // test createEntity() of type container (With NestedCreateMenuItemContainerItemDto, variableMaxAmount = null)
  it('should create item of type container (With NestedCreateMenuItemContainerItemDto, variableMaxAmount = null)', async () => {});

  // test updateEntity() of entity that is of type container with NestedUpdateMenuItemContainerItemDto and NestedCreateMenuItemContainerItemDto
  it('should update item of type container (With NestedUpdateMenuItemContainerItemDto and NestedCreateMenuItemContainerItemDto)', async () => {});

  // test findAll()
  it('should find all items', async () => {});

  // test findAll() with search by name
  it('should find all items with search by name', async () => {});

  // test findAll() with filter by category
  it('should find all items with filter by category', async () => {});

  // test findAll() with sort by name
  it('should find all items with sort by name', async () => {});

  // test findAll() with sort by category
  it('should find all items with sort by category', async () => {});

  // test findOne()
  it('should find one item', async () => {});

  // test findOne() with relations
  it('should find one item with relations', async () => {});

  // test remove()
  it('should remove item', async () => {});
});
