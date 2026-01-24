import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemSizeService } from './menu-item-size.service';

class TestableMenuItemSizeService extends MenuItemSizeService {
  async createEntityForTest(
    dto: CreateMenuItemSizeDto,
    manager: EntityManager,
  ): Promise<MenuItemSize> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateMenuItemSizeDto,
    entity: MenuItemSize,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}
describe('menu item size service', () => {
  let testingUtil: MenuItemTestingUtil;
  let sizeService: MenuItemSizeService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule({
      menuItemSizeServiceClass: TestableMenuItemSizeService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);

    sizeService = module.get(
      MenuItemSizeService,
    ) as TestableMenuItemSizeService;
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(sizeService).toBeDefined();
  });

  // test createEntity()
  it('should create size', async () => {});

  // test updateEntity()
  it('should update size', async () => {});

  // test findAll()
  it('should find all sizes', async () => {});

  // test findall() with sort by name
  it('should find all sizes with sort by name', async () => {});

  // test findOne()
  it('should find one size', async () => {});

  // test remove()
  it('should remove size', async () => {});
});
