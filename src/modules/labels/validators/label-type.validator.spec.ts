import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { type_a } from '../utils/constants';
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
  it('successfully validate create with no validation errors', async () => {
    const dto: CreateLabelTypeDto = {
      name: 'New Label Type',
      length: 400,
      width: 200,
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: name already exists', async () => {
    const dto: CreateLabelTypeDto = {
      name: type_a,
      length: 400,
      width: 200,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Item with this name already exists',
    );
  });

  it('fail validate create: length with value 0', async () => {
    const dto: CreateLabelTypeDto = {
      name: 'New Label Type',
      length: 0,
      width: 200,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'length' }],
      'Must be greater than 0',
    );
  });

  it('fail validate create: width with value 0', async () => {
    const dto: CreateLabelTypeDto = {
      name: 'New Label Type',
      length: 400,
      width: 0,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'width' }],
      'Must be greater than 0',
    );
  });

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {
    const typeToUpdate = await typeRepo.findOne({ where: { name: type_a } });
    if (!typeToUpdate) {
      throw new Error('type not found');
    }

    const dto: UpdateLabelTypeDto = {
      name: 'Updated Label Type',
      length: 500,
      width: 300,
    };

    const errors = await validator.validateUpdateNode(dto, typeToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: name already exists', async () => {
    const types = await typeRepo.find();
    if (types.length < 2) {
      throw new Error('Not enough types for test');
    }

    const typeToUpdate = types[0];
    const existingType = types[1];

    const dto: UpdateLabelTypeDto = {
      name: existingType.name,
    };

    const errors = await validator.validateUpdateNode(dto, typeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Item with this name already exists',
    );
  });

  it('fail validate update: length with value 0', async () => {
    const typeToUpdate = await typeRepo.findOne({ where: { name: type_a } });
    if (!typeToUpdate) {
      throw new Error('type not found');
    }

    const dto: UpdateLabelTypeDto = {
      length: 0,
    };

    const errors = await validator.validateUpdateNode(dto, typeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'length' }],
      'Must be greater than 0',
    );
  });

  it('fail validate update: width with value 0', async () => {
    const typeToUpdate = await typeRepo.findOne({ where: { name: type_a } });
    if (!typeToUpdate) {
      throw new Error('type not found');
    }

    const dto: UpdateLabelTypeDto = {
      width: 0,
    };

    const errors = await validator.validateUpdateNode(dto, typeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'width' }],
      'Must be greater than 0',
    );
  });
});
