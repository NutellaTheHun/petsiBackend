import { TestingModule } from '@nestjs/testing';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelTypeService } from '../services/label-type.service';
import { type_a, type_b } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeValidator } from './label-type.validator';

describe('label type validator', () => {
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: LabelTypeValidator;
  let service: LabelTypeService;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();
    validator = module.get<LabelTypeValidator>(LabelTypeValidator);
    service = module.get<LabelTypeService>(LabelTypeService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    await testingUtil.initLabelTypeTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      name: 'LABEL TYPE TEST',
      length: 100,
      width: 100,
    } as CreateLabelTypeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      name: type_a,
      length: 100,
      width: 100,
    } as CreateLabelTypeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('labelTypeName');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(type_b);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: 'LABEL TYPE TEST',
      length: 100,
      width: 100,
    } as UpdateLabelTypeDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(type_b);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: type_a,
      length: 100,
      width: 100,
    } as UpdateLabelTypeDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('labelTypeName');
  });
});
