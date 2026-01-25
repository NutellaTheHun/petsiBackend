import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
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

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: name already exists', async () => {});

  it('fail validate create: abbreviation already exists', async () => {});

  it('fail validate create: conversion factor cannot be 0', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: abbreviation already exists', async () => {});

  it('fail validate update: conversion factor cannot be 0', async () => {});
});
