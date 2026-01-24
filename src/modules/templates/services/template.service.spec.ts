import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateService } from './template.service';

class TestableTemplateService extends TemplateService {
  async createEntityForTest(
    dto: CreateTemplateDto,
    manager: EntityManager,
  ): Promise<Template> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateTemplateDto,
    entity: Template,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Template Service', () => {
  let templateService: TemplateService;
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let templateItemRepo: Repository<TemplateMenuItem>;

  let menuItemRepo: Repository<MenuItem>;
  let menuItemTestUtil: MenuItemTestingUtil;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule({
      templateServiceClass: TestableTemplateService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateTestDatabase(dbTestContext);

    templateService = module.get(TemplateService) as TestableTemplateService;
    dataSource = module.get(DataSource);

    templateItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(templateService).toBeDefined();
  });

  // test createEntity()

  // test updateEntity()

  // test findAll()

  // test findOne()

  // test remove()
});
