import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateValidator } from './template.validator';

describe('template validator', () => {
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: TemplateValidator;
  let templateRepo: Repository<Template>;
  let menuItemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

    validator = module.get<TemplateValidator>(TemplateValidator);

    templateRepo = module.get(getRepositoryToken(Template));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: name already exists', async () => {});

  it('fail validate create: duplicate menu items on template menu items', async () => {});

  it('fail validate create: duplicate table position on template items', async () => {});

  it('fail validate create: nested template menu items validator errors: positional index cannot be less than 0', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: duplicate menu items on template menu items', async () => {});

  it('fail validate update: duplicate table position on template items', async () => {});

  it('fail validate update: nested template menu items validator errors: positional index cannot be less than 0', async () => {});
});
