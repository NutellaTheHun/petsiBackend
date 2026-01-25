import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryValidator } from './unit-of-measure-category.validator';

describe('unit of measure category validator', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: UnitOfMeasureCategoryValidator;
  let categoryRepo: Repository<UnitOfMeasureCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UnitOfMeasureTestingUtil>(
      UnitOfMeasureTestingUtil,
    );
    await testingUtil.initUnitCategoryTestDatabase(dbTestContext);

    validator = module.get<UnitOfMeasureCategoryValidator>(
      UnitOfMeasureCategoryValidator,
    );

    categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      name: 'TEST NAME',
    } as CreateUnitOfMeasureCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      name: VOLUME,
    } as CreateUnitOfMeasureCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('categoryName');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(WEIGHT);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: 'TEST NAME',
    } as UpdateUnitOfMeasureCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(WEIGHT);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: VOLUME,
    } as UpdateUnitOfMeasureCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('categoryName');
  });
});
