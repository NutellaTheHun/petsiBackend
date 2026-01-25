import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemValidator } from './template-menu-item.validator';

describe('template menu item validator', () => {
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: TemplateMenuItemValidator;
  let templateMenuItemRepo: Repository<TemplateMenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

    validator = module.get<TemplateMenuItemValidator>(
      TemplateMenuItemValidator,
    );

    templateMenuItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });
});
