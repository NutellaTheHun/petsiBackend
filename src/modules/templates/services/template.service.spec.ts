import { NotFoundException } from '@nestjs/common';
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
import { template_a } from '../utils/constants';
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
  let templateService: TestableTemplateService;
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let templateRepo: Repository<Template>;
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
    templateRepo = module.get(getRepositoryToken(Template));
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
  it('should create template', async () => {
    const dto: CreateTemplateDto = { name: 'Test Template' };

    await dataSource.transaction(async (manager) => {
      const result = await templateService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.name).toEqual(dto.name);
    });
  });

  // TODO: test createEntity() with NestedCreateTemplateMenuItemDtos
  it('should create template with NestedCreateTemplateMenuItemDtos', async () => {});

  // test updateEntity()
  it('should update template', async () => {
    const t = await templateRepo.findOne({ where: { name: template_a } });
    if (!t) throw new Error('template not found');

    const dto: UpdateTemplateDto = { name: 'Template A Updated', isPie: true };

    await dataSource.transaction(async (manager) => {
      await templateService.updateEntityForTest(dto, t, manager);
    });

    const result = await templateRepo.findOne({ where: { id: t.id } });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
    expect(result.isPie).toEqual(dto.isPie);
  });

  // test findAll()
  it('should find all templates', async () => {
    const repoResult = await templateRepo.find();
    const serviceResult = await templateService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findOne()
  it('should find one template', async () => {
    const t = await templateRepo.find({ take: 1 });
    if (!t.length) throw new Error('template not found');

    const serviceResult = await templateService.findOne(t[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(t[0].id);
  });

  // test remove()
  it('should remove template', async () => {
    const t = await templateRepo.findOne({ where: { name: 'Test Template' } });
    if (!t)
      throw new Error('template not found (create "Test Template" first)');
    const id = t.id;

    const deleteResult = await templateService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(templateService.findOne(id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
