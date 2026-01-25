import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { FL_OUNCE, GALLON, GRAM, OUNCE_ABBREV, UNIT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureValidator } from './unit-of-measure.validator';

describe('unit of measure validator', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: UnitOfMeasureValidator;
  let unitRepo: Repository<UnitOfMeasure>;
  let categoryRepo: Repository<UnitOfMeasureCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UnitOfMeasureTestingUtil>(
      UnitOfMeasureTestingUtil,
    );
    await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

    validator = module.get<UnitOfMeasureValidator>(UnitOfMeasureValidator);

    unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
    categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const category = await categoryService.findOneByName(UNIT);
    if (!category) {
      throw new Error();
    }

    const dto = {
      name: 'TEST ITEM',
      abbreviation: 'ABREV',
      categoryId: category.id,
      conversionFactorToBase: '1234',
    } as CreateUnitOfMeasureDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const category = await categoryService.findOneByName(UNIT);
    if (!category) {
      throw new Error();
    }

    const dto = {
      name: GALLON,
      abbreviation: 'ABREV',
      categoryId: category.id,
      conversionFactorToBase: '1234',
    } as CreateUnitOfMeasureDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('name');
  });

  it('should fail create (abbrev already exists)', async () => {
    const category = await categoryService.findOneByName(UNIT);
    if (!category) {
      throw new Error();
    }

    const dto = {
      name: 'TEST CREATE',
      abbreviation: OUNCE_ABBREV,
      categoryId: category.id,
      conversionFactorToBase: '1234',
    } as CreateUnitOfMeasureDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('abbreviation');
  });

  it('should pass update', async () => {
    const toUpdate = await unitService.findOneByName(GRAM);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(UNIT);
    if (!category) {
      throw new Error();
    }

    const dto = {
      name: 'TEST UPDATE',
      abbreviation: 'abbrev',
      categoryId: category.id,
      conversionFactorToBase: '1234',
    } as UpdateUnitOfMeasureDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await unitService.findOneByName(GRAM);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(UNIT);
    if (!category) {
      throw new Error();
    }

    const dto = {
      name: FL_OUNCE,
      abbreviation: 'abbrev',
      categoryId: category.id,
      conversionFactorToBase: '1234',
    } as UpdateUnitOfMeasureDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('name');
  });

  it('should fail update (abbrev already exists)', async () => {
    const toUpdate = await unitService.findOneByName(GRAM);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(UNIT);
    if (!category) {
      throw new Error();
    }

    const dto = {
      name: 'TEST CREATE',
      abbreviation: OUNCE_ABBREV,
      categoryId: category.id,
      conversionFactorToBase: '1234',
    } as UpdateUnitOfMeasureDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('abbreviation');
  });
});
