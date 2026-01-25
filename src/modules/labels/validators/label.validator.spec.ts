import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelValidator } from './label.validator';

describe('label validator', () => {
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: LabelValidator;
  let labelRepo: Repository<Label>;
  let labelTypeRepo: Repository<LabelType>;
  let itemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    await testingUtil.initLabelTestDatabase(dbTestContext);

    validator = module.get<LabelValidator>(LabelValidator);

    labelRepo = module.get(getRepositoryToken(Label));
    labelTypeRepo = module.get(getRepositoryToken(LabelType));
    itemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create with no validation errors', async () => {});

  it('fail validate create: labelType and menuItemalready exists for this item.', async () => {});

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {});

  it('fail validate update: labelType and menuItem already exists for this item.', async () => {});
});
