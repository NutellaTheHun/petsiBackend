import { TestingModule } from '@nestjs/testing';
import Big from "big.js";
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { CUP, EACH, FL_OUNCE, GALLON, GRAM, KILOGRAM, LITER, NO_CAT, OUNCE, PINT, POUND, QUART, UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateUnitOfMeasureDto } from '../dto/create-unit-of-measure.dto';

describe('UnitOfMeasureService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let unitService: UnitOfMeasureService;
  let categoryService: UnitCategoryService;

  //let testUnits: UnitOfMeasure[];
  let testId: number;
  let testIds: number[]

  beforeAll(async () => {
      const module: TestingModule = await getUnitOfMeasureTestingModule();
      dbTestContext = new DatabaseTestContext();
      testingUtil = module.get<UnitOfMeasureTestingUtil>(UnitOfMeasureTestingUtil);
      await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

      unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
      categoryService = module.get<UnitCategoryService>(UnitCategoryService);

      //testUnits = await testingUtil.getUnitsOfMeasureEntities(dbTestContext);
    });
  
    afterAll(async () => {
      await dbTestContext.executeCleanupFunctions();
    })

  it('unitService should be defined', () => {
    expect(unitService).toBeDefined();
  });

  /**
   * Creational Requirements:
   * 
   * Optional Requirements:
   * 
   * Denied creational properties:
   * 
   */
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
    expect(result?.category?.name).toEqual(NO_CAT);

    testId = result?.id as number;
  });

  it('should find one unit of measure', async () => {
    const result = await unitService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1")
  });

  it('should find one unit of measure by name', async () => {
    const result = await unitService.findOneByName("testUnit");
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1");
  });

  it('should update unit of measure name', async () => {
    const dto = {
      name: "UPDATE testUnit",
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("testAbrev");
    expect(result?.conversionFactorToBase).toEqual("1");
  });

  it('should update unit of measure abbreviation', async () => {
    const dto = {
      abbreviation: "UPDATE Abbrev"
    } as UpdateUnitOfMeasureDto;

    const result = await unitService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATE testUnit");
    expect(result?.abbreviation).toEqual("UPDATE Abbrev");
    expect(result?.conversionFactorToBase).toEqual("1");
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
    expect(result?.conversionFactorToBase).toEqual("2");
    expect(result?.category?.name).toEqual(WEIGHT);
  });

  it('category should contain reference to unit of measure', async () => {
    const weightCategory = await categoryService.findOneByName(WEIGHT, ["units"]);
    if(!weightCategory){ throw new Error("weight category not found"); }
  });

  it('should update unit of measure category (old category -> new category)', async () => {

  });

  it('old category should not have reference to unit of measure', async () => {

  });

  it('new category should have reference to unit of measure', async () => {

  });

  it('should remove unit of measure', async () => {

  });

  it('new category should lose reference to unit of measure', async () => {

  });

  it('should get all units of measure', async () => {

  });

  it('should get units of measure by list of ids', async () => {

  });

  it('should set unit category to null when deleting category', async () => {

  });

  // Unit conversions
  // if baseUnit is null
  // if conversion factor is null for A or B

  it('should retrieve all test units', async () => {
    const results = await unitService.findAll();
    testId = results[0]?.id;

    expect(results).not.toBeNull();
    expect(results.length).toEqual(testUnits.length);
  });

  it('should retrieve one test unit', async () => {
    const result = await unitService.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should retrieve one test unit by name', async () => {
    const result = await unitService.findOneByName(GRAM);
    expect(result).not.toBeNull();
  });

  it('should initialize default units', async () => {
    await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);
    const units = await testingUtil.getUnitsOfMeasureEntities(dbTestContext);

    const results = await unitService.findAll();
    expect(results.length).toEqual(units.length);
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
  

  it('should update test unit name', async () => {
    const toUpdate = await unitService.findOne(testId, ['category']);
    if(!toUpdate){ throw new Error("unit to update is null"); }
    if(!toUpdate.category) { throw new Error("category is null"); }
    
    toUpdate.name = "UPDATED_NAME";
    const result = await unitService.update(
      toUpdate.id, 
      { name: toUpdate.name } as UpdateUnitOfMeasureDto
    );

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_NAME");
  });

  it('should change test unit category, old category should lose reference, new should gain', async () => {
    const toUpdate = await unitService.findOne(testId, ['category']);
    if(!toUpdate){ throw new Error("unit to update is null"); }
    if(!toUpdate.category) { throw new Error("category is null"); }

    const oldCategory = await categoryService.findOne(toUpdate.category.id, ['units']);
    if(!oldCategory){ throw new Error('oldCategory is null'); }
    expect(oldCategory.units.findIndex(u => u.id === toUpdate.id)).not.toEqual(-1);

    let newCategory = await categoryService.findOneByName(UNIT);
    if(newCategory?.id === oldCategory.id){
      newCategory = await categoryService.findOneByName(VOLUME);
    }
    const result = await unitService.update(
      toUpdate.id, 
      { categoryId: newCategory?.id } as UpdateUnitOfMeasureDto
    );

    expect(result).not.toBeNull();
    expect(result?.category?.id).toEqual(newCategory?.id);

    const verifyOld = await categoryService.findOne(oldCategory.id, ['units']);
    expect(verifyOld?.units.findIndex(u => u.id === result?.id)).toEqual(-1);

    const verifyNew = await categoryService.findOne(newCategory?.id as number, ['units']);
    expect(verifyNew?.units.findIndex(u => u.id === result?.id)).not.toEqual(-1);
  });

  it('should unset test unit category, old category should lose reference', async () => {
    const toUpdate = await unitService.findOne(testId, ['category']);
    if(!toUpdate){ throw new Error("unit to update is null"); }
    if(!toUpdate.category) { throw new Error("category is null"); }

    const oldCategory = await categoryService.findOne(toUpdate.category.id);
    if(!oldCategory){ throw new Error('oldCategory is null'); }

    const result = await unitService.update(
      toUpdate.id, 
      { categoryId: 0 } as UpdateUnitOfMeasureDto
    );
    expect(result).not.toBeNull();
    expect(result?.category).toBeNull();

    const verifyOld = await categoryService.findOne(toUpdate.category.id, ['units']); 
    expect(verifyOld?.units.findIndex(u => u.id === result?.id)).toEqual(-1);
  });

  it('should remove one test unit', async () => {
    const result = await unitService.remove(testId);
    expect(result).toBeTruthy();

    const verify = await unitService.findOne(testId);
    expect(verify).toBeNull();
  });
});
