import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { TemplateMenuItemService } from './template-menu-item.service';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { getTemplateTestingModule } from '../utils/template-testing.module';

describe('Template menu item service', () => {
  let service: TemplateMenuItemService;
  let testUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    dbTestContext = new DatabaseTestContext();
    testUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);

    service = module.get<TemplateMenuItemService>(TemplateMenuItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
