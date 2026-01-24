import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemService } from './template-menu-item.service';

class TestableTemplateMenuItemService extends TemplateMenuItemService {
  async createEntityForTest(
    dto: CreateTemplateMenuItemDto,
    manager: EntityManager,
  ): Promise<TemplateMenuItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateTemplateMenuItemDto,
    entity: TemplateMenuItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}
describe('Template menu item service', () => {
  let templateItemService: TemplateMenuItemService;
  let testUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let templateRepo: Repository<Template>;

  let menuItemRepo: Repository<MenuItem>;
  let menuItemTestUtil: MenuItemTestingUtil;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule({
      templateMenuItemServiceClass: TestableTemplateMenuItemService,
    });
    dbTestContext = new DatabaseTestContext();
    testUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testUtil.initTemplateMenuItemTestDatabase(dbTestContext);

    templateItemService = module.get(
      TemplateMenuItemService,
    ) as TestableTemplateMenuItemService;

    dataSource = module.get(DataSource);

    templateRepo = module.get(getRepositoryToken(Template));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));

    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(templateItemService).toBeDefined();
  });

  // test createEntity() with NestedCreateTemplateMenuItemDto
  it('should create template menu item with NestedCreateTemplateMenuItemDto', async () => {});

  // test updateEntity() with NestedUpdateTemplateMenuItemDto and NestedCreateTemplateMenuItemDto
  it('should update template menu item with NestedUpdateTemplateMenuItemDto and NestedCreateTemplateMenuItemDto', async () => {});

  // test findAll()
  it('should find all template menu items', async () => {});

  // test findAll() with search by name
  it('should find all template menu items with search by name', async () => {});

  // test findAll() with sortBy by name
  it('should find all template menu items with filter by menu item name', async () => {});

  // test findOne()
  it('should find one template menu item', async () => {});

  // test findOne() with relations
  it('should find one template menu item with relations', async () => {});

  // test remove()
  it('should remove template menu item', async () => {});
});
