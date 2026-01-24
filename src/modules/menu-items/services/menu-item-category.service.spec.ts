import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryService } from './menu-item-category.service';

class TestableMenuItemCategoryService extends MenuItemCategoryService {
  async createEntityForTest(
    dto: CreateMenuItemCategoryDto,
    manager: EntityManager,
  ): Promise<MenuItemCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateMenuItemCategoryDto,
    entity: MenuItemCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('menu item category service', () => {
  let testingUtil: MenuItemTestingUtil;
  let categoryService: MenuItemCategoryService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule({
      menuItemCategoryServiceClass: TestableMenuItemCategoryService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);

    categoryService = module.get(
      MenuItemCategoryService,
    ) as TestableMenuItemCategoryService;

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  // test createEntity()
  it('should create category', async () => {});

  // test updateEntity()
  it('should update category', async () => {});

  // test findAll()
  it('should find all categories', async () => {});

  // test findall() with sort by name
  it('should find all categories with sort by name', async () => {});

  // test findOne()
  it('should find one category', async () => {});

  // test findOne() with relations
  it('should find one category with relations', async () => {});

  // test remove()
  it('should remove category', async () => {});
});
