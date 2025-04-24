import { TestingModule } from '@nestjs/testing';
import { LabelService } from './label.service';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';

describe('LabelsService', () => {
  let labelService: LabelService;
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();

    labelService = module.get<LabelService>(LabelService);
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    dbTestContext = new DatabaseTestContext();
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(labelService).toBeDefined();
  });
});
