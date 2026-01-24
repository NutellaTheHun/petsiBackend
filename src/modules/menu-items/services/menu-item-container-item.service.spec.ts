import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
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
    expect(containerItemService).toBeDefined();
  });

  // test createEntity()
  it('should create container item', async () => {});

  // test updateEntity()
  it('should update container item', async () => {});

  // test findAll()
  it('should find all container items', async () => {});

  // test findall() with sort by containedMenuItem name
  it('should find all container items with sort by containedMenuItem name', async () => {});

  // test findOne()
  it('should find one container item', async () => {});

  // test findOne() with relations
  it('should find one container item with relations', async () => {});

  // test remove()
  it('should remove container item', async () => {});
});
