import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { LabelType } from '../entities/label-type.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeValidator } from './label-type.validator';

describe('label type validator', () => {
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: LabelTypeValidator;
  let typeRepo: Repository<LabelType>;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    await testingUtil.initLabelTypeTestDatabase(dbTestContext);

    validator = module.get<LabelTypeValidator>(LabelTypeValidator);

    typeRepo = module.get(getRepositoryToken(LabelType));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create with no validation errors', async () => {});

  it('fail validate create: name already exists', async () => {});

  it('fail validate create: length with value 0', async () => {});

  it('fail validate create: width with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: length with value 0', async () => {});

  it('fail validate update: width with value 0', async () => {});
});
