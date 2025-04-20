import { TestingModule } from '@nestjs/testing';
import Big from "big.js";
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateUnitOfMeasureDto } from '../dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';
import { CUP, EACH, FL_OUNCE, GALLON, GRAM, KILOGRAM, LITER, OUNCE, PINT, POUND, QUART, UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasureService } from './unit-of-measure.service';

describe('UnitOfMeasureService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let unitService: UnitOfMeasureService;
  let categoryService: UnitCategoryService;

  let testId: number;
  let testIds: number[]

  beforeAll(async () => {
      const module: TestingModule = await getUnitOfMeasureTestingModule();
      
      dbTestContext = new DatabaseTestContext();
      testingUtil = module.get<UnitOfMeasureTestingUtil>(UnitOfMeasureTestingUtil);
      await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

      unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
      categoryService = module.get<UnitCategoryService>(UnitCategoryService);
    });
  
    afterAll(async () => {
      await dbTestContext.executeCleanupFunctions();
    })

  it('unitService should be defined', () => {
    expect(unitService).toBeDefined();
  });

  it('should create a unit of measure (no category)', async () => {
    const dto = {
      name: "testUnit",
      abbreviation: "testAbrev",
      conversionFactorToBase: "1",
    } as CreateUnitOfMeasureDto;

    const result = await unitService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1")

    testId = result?.id as number;
  });

  it('should find one unit of measure', async () => {
    const result = await unitService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1.0000000000")
  });

  it('should find one unit of measure by name', async () => {
    const result = await unitService.findOneByName("testUnit");
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1.0000000000");
  });

  it('should update unit of measure name', async () => {
    const dto = {
      name: "UPDATE testUnit",
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1.0000000000");
  });

  it('should update unit of measure abbreviation', async () => {
    const dto = {
      abbreviation: "UPDATE Abbrev"
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("1.0000000000");
  });

  it('should update unit of measure conversion factor', async () => {
    const dto = {
      conversionFactorToBase: "2"
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("2");
  });

  it('should update unit of measure category (no category -> new category)', async () => {
    const weightCategory = await categoryService.findOneByName(WEIGHT);
    if(!weightCategory){ throw new Error("weight category not found"); }
    const dto = {
      categoryId: weightCategory?.id,
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("2.0000000000");
    expect(result?.category?.name).toEqual(WEIGHT);
  });

  it('category should contain reference to unit of measure', async () => {
    const weightCategory = await categoryService.findOneByName(WEIGHT, ["units"]);
    if(!weightCategory){ throw new Error("weight category not found"); }

    expect(weightCategory.units.findIndex(unit => unit.id === testId)).not.toEqual(-1);
  });

  it('should update unit of measure category (old category -> new category)', async () => {
    const volumeCategory = await categoryService.findOneByName(VOLUME);
    if(!volumeCategory){ throw new Error("volume category not found"); }
    const dto = {
      categoryId: volumeCategory?.id,
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("2.0000000000");
    expect(result?.category?.name).toEqual(VOLUME);
  });

  it('old category should not have reference to unit of measure', async () => {
    const weightCategory = await categoryService.findOneByName(WEIGHT, ["units"]);
    if(!weightCategory){ throw new Error("weight category not found"); }

    expect(weightCategory.units.findIndex(unit => unit.id === testId)).toEqual(-1);
  });

  it('new category should have reference to unit of measure', async () => {
    const volumeCategory = await categoryService.findOneByName(VOLUME, ["units"]);
    if(!volumeCategory){ throw new Error("weight category not found"); }

    expect(volumeCategory.units.findIndex(unit => unit.id === testId)).not.toEqual(-1);
  });

  it('should remove category', async () => {
    const dto = {
      categoryId: 0,
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("2.0000000000");
    expect(result?.category).toBeNull();
  });

  it('should update unit of measure categor (for next test)', async () => {
    const volumeCategory = await categoryService.findOneByName(VOLUME);
    if(!volumeCategory){ throw new Error("volume category not found"); }
    const dto = {
      categoryId: volumeCategory?.id,
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("2.0000000000");
    expect(result?.category?.name).toEqual(VOLUME);
  });

  it('should remove unit of measure', async () => {
    const removal = await unitService.remove(testId);
    expect(removal).toBeTruthy();
    
    const verify = await unitService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('new category should lose reference to unit of measure', async () => {
    const volumeCategory = await categoryService.findOneByName(VOLUME, ["units"]);
    if(!volumeCategory){ throw new Error("weight category not found"); }

    expect(volumeCategory.units.findIndex(unit => unit.id === testId)).toEqual(-1);
  });

  it('should get all units of measure', async () => {
    const expected = await testingUtil.getUnitsOfMeasureEntities(dbTestContext);

    const results = await unitService.findAll();
    expect(results.length).toEqual(expected.length);

    testIds = [ results[0].id, results[1].id, results[2].id ];
  });

  it('should get units of measure by list of ids', async () => {
    const results = await unitService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
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

  it('should set unit category to null when deleting category', async () => {
    const volumeCategory = await categoryService.findOneByName(VOLUME, ["units"]);
    if(!volumeCategory){ throw new Error("weight category not found"); }

    const testUnitId = volumeCategory.units[0].id;

    const removal = await categoryService.remove(volumeCategory.id);
    if(!removal){ throw new Error("removal of category failed"); }

    const unit = await unitService.findOne(testUnitId, ["category"]);
    if(!unit){ throw new Error("unit is null"); }

    expect(unit.category).toBeNull();
  });
});
