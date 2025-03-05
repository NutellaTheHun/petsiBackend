import { TestingModule } from '@nestjs/testing';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { UnitOfMeasureFactory } from '../factories/unit-of-measure.factory';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { CUP, EACH, FL_OUNCE, GALLON, GRAM, KILOGRAM, LITER, OUNCE, PINT, POUND, QUART, UNIT } from '../utils/constants';
import Big from "big.js";

describe('UnitOfMeasureService', () => {
  let unitService: UnitOfMeasureService;
  let unitFactory: UnitOfMeasureFactory;
  let categoryService: UnitCategoryService;

  let testUnits: UnitOfMeasure[];
  let testUnitId: number;

  beforeAll(async () => {
      const module: TestingModule = await getUnitOfMeasureTestingModule();
  
      unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
      unitFactory = module.get<UnitOfMeasureFactory>(UnitOfMeasureFactory);
      categoryService = module.get<UnitCategoryService>(UnitCategoryService);

      await categoryService.initializeDefaultCategories();
      testUnits = await unitFactory.getTestingUnits();
    });
  
    afterAll(async () => {
      const unitQueryBuilder = unitService.getQueryBuilder();
      await unitQueryBuilder.delete().execute();

      const categoryQueryBuilder = categoryService.getQueryBuilder();
      await categoryQueryBuilder.delete().execute();
    })

  it('unitService should be defined', () => {
    expect(unitService).toBeDefined();
  });

  it('should insert all test units', async () => {
    const insertion = await Promise.all(
      testUnits.map((
        unit => unitService.create(unitFactory.createDtoInstance(unit))
        ))
    );

    expect(insertion).not.toBeNull();
    insertion.map(unit => {
      expect(unit?.id).not.toBeNull()
    });
  });

  it('should retrieve all test units', async () => {
    const results = await unitService.findAll();
    testUnitId = results[0]?.id;

    expect(results).not.toBeNull();
    expect(results.length).toEqual(testUnits.length);
  });

  it('should retrieve one test unit', async () => {
    const result = await unitService.findOne(testUnitId);
    expect(result).not.toBeNull();
  });

  it('should retrieve one test unit by name', async () => {
    const result = await unitService.findOneByName(GRAM);
    expect(result).not.toBeNull();
  });

  it('should initialize default units', async () => {
    await unitService.initializeDefaultUnits();
    
    const results = await unitService.findAll();
    expect(results.length).toEqual((await unitFactory.getDefaultUnits()).length);
  });


  it('should convert 1 gallon to liters', async () => {
    const unitA = await unitService.findOneByName(GALLON, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(LITER, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(1, unitA, unitB);
    expect(result).toEqual(new Big("3.78541178400001928642"));
  });

  it('should convert 2 quarts to pints', async () => {
    const unitA = await unitService.findOneByName(QUART, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(PINT, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(2, unitA, unitB);
    expect(result).toEqual(new Big("4"));
  });

  // fl_ounce to cup
  it('should convert 3 fl ounce to cup', async () => {
    const unitA = await unitService.findOneByName(FL_OUNCE, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(CUP, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(3, unitA, unitB);
    expect(result).toEqual(new Big("0.36966911953125188344"));
  });

  // cup to liter
  it('should convert 4 cups to liters', async () => {
    const unitA = await unitService.findOneByName(CUP, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(LITER, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(4, unitA, unitB);
    expect(result).toEqual(new Big("0.96"));
  });

  // ounce to kilogram
  it('should convert 80 ounce to kilograms', async () => {
    const unitA = await unitService.findOneByName(OUNCE, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(KILOGRAM, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(80, unitA, unitB);
    expect(result).toEqual(new Big("2.26796"));
  });

  // pound to ounce
  it('should convert 2 pounds to ounces', async () => {
    const unitA = await unitService.findOneByName(POUND, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(OUNCE, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(2, unitA, unitB);
    expect(result).toEqual(new Big("32.0000000003315755128"));
  });

  // gram to pound
  it('should convert 100 grams to pounds', async () => {
    const unitA = await unitService.findOneByName(GRAM, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(POUND, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(100, unitA, unitB);
    expect(result).toEqual(new Big("0.22046244201609337581"));
  });

  // unit to each
  it('should convert 1 unit to 1 each', async () => {
    const unitA = await unitService.findOneByName(UNIT, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(EACH, ['category']);
    if(!unitB) throw new Error("unitB not found");

    const result = unitService.convert(1, unitA, unitB);
    expect(result).toEqual(new Big("1"));
  });

  it('should fail to convert (different categories)', async () => {
    const unitA = await unitService.findOneByName(GALLON, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(POUND, ['category']);
    if(!unitB) throw new Error("unitB not found");

    expect(() => unitService.convert(1, unitA, unitB)).toThrow(Error);
  });

  it('should fail to convert (conversion factor not set)', async () => {
    const unitA = await unitService.findOneByName(GALLON, ['category']);
    if(!unitA) throw new Error("unitA not found");
    const unitB = await unitService.findOneByName(LITER, ['category']);
    if(!unitB) throw new Error("unitB not found");

    unitA.conversionFactorToBase = undefined;

    expect(() => unitService.convert(1, unitA, unitB)).toThrow(Error);
  });
  

  it('should update one test unit', async () => {
    const toUpdate = await unitService.findOne(testUnitId, ['category']);
    if(!toUpdate){ throw new Error("unit to update is null"); }
    if(!toUpdate.category) { throw new Error("category is null"); }
    
    toUpdate.name = "UPDATED_NAME";
    const result = await unitService.update(toUpdate.id, toUpdate);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_NAME");
  });

  it('should remove one test unit', async () => {
    const result = await unitService.remove(testUnitId);
    expect(result).toBeTruthy();

    const verify = await unitService.findOne(testUnitId);
    expect(verify).toBeNull();
  });

});
