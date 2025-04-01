import { TestingModule } from '@nestjs/testing';
import { CreateUnitCategoryDto } from '../dto/create-unit-category.dto';
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';
import { UnitCategory } from '../entities/unit-category.entity';
import { OUNCE, POUND, UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { UnitCategoryBuilder } from '../builders/unit-category.builder';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';


describe('UnitCategoryService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let categoryService: UnitCategoryService;
  let categoryBuilder: UnitCategoryBuilder;
  let unitService: UnitOfMeasureService;

  let testCategoryId: number;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UnitOfMeasureTestingUtil>(UnitOfMeasureTestingUtil);
    await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);
    
    categoryService = module.get<UnitCategoryService>(UnitCategoryService);
    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  })

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  it('should retrieve all test categories', async () => {
    const testCategories = await testingUtil.getCategoryEntities(dbTestContext);
    const results = await categoryService.findAll();
    expect(results.length).toEqual(testCategories.length);

    if(results[0]?.id){ testCategoryId = results[0].id; }
  });

  it('should retrieve one test category', async() => {
    const result = await categoryService.findOne(testCategoryId);
    expect(result).not.toBeNull();
  });

  it('should retrieve one test category by name', async() => {
    const result = await categoryService.findOneByName(WEIGHT);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(WEIGHT);
  });

    
  it('should set each categories base unit', async () => {
    await testingUtil.initializeDefaultCategoryBaseUnits();
    
    const weight = await categoryService.findOneByName(WEIGHT, ['baseUnit',]);
    expect(weight).not.toBeNull();
    expect(weight?.baseUnit).not.toBeNull();

    const volume = await categoryService.findOneByName(VOLUME, ['baseUnit']);
    expect(volume).not.toBeNull();
    expect(volume?.baseUnit).not.toBeNull();

    const unit = await categoryService.findOneByName(UNIT, ['baseUnit']);
    expect(unit).not.toBeNull();
    expect(unit?.baseUnit).not.toBeNull();
  });

  it('should contain each list of units per category', async () => {
    // should have 4 weight units
    const weight = await categoryService.findOneByName(WEIGHT, ['units']);
    expect(weight).not.toBeNull();
    expect(weight?.units).not.toBeNull();
    expect(weight?.units.length).toEqual(4);

    // should be 9 volume units
    const volume = await categoryService.findOneByName(VOLUME, ['units']);
    expect(volume).not.toBeNull();
    expect(volume?.units).not.toBeNull();
    expect(volume?.units.length).toEqual(9);

    // should be 2 in unit category
    const unit = await categoryService.findOneByName(UNIT, ['units']);
    expect(unit).not.toBeNull();
    expect(unit?.units).not.toBeNull();
    expect(unit?.units.length).toEqual(2);
  });

  it('should update categories units list after unit changes category', async () => {
    const unit = await unitService.findOneByName(OUNCE, ['category']);
    if(!unit) {throw new Error('couldnt find unit'); }

    const oldCategoryId = unit?.category?.id;
    if(!oldCategoryId){ throw new Error('old category id is null'); }

    const newCategory = await categoryService.findOneByName(VOLUME);
    if(!newCategory) {throw new Error('couldnt find category'); }

    await unitService.update(
      unit.id,
      { categoryId: newCategory?.id } as UpdateUnitOfMeasureDto
    );
    
    const verifyNotInOld = await categoryService.findOne(oldCategoryId, ['units']);
    expect(verifyNotInOld?.units.find(u => u.id == unit.id)).toBeUndefined();

    const verifyInNew = await categoryService.findOne(newCategory.id, ['units']);
    expect(verifyInNew?.units.find(u => u.id == unit.id)).not.toBeUndefined();
  });

  it('should update category list after removing a unit of measure', async () => {
    const unitToRemove = await unitService.findOneByName(POUND, ['category']);
    if(!unitToRemove){ throw new Error('unit not found.'); }

    await unitService.remove(unitToRemove.id);

    if(!unitToRemove.category?.id){ throw new Error('unit has no category'); }
    const category = await categoryService.findOne(unitToRemove.category.id, ['units']);
    if(!category) { throw new Error('category not found'); }

    expect(category.units.find(u => u.id == unitToRemove.id)).toBeUndefined();
  });
  
  it('should update one test category', async() => {
    const category = await categoryService.findOne(testCategoryId);
    if(!category){ throw new Error("category is null"); }

    category.name = "UPDATED_NAME";
    const update = await categoryService.update(category.id, category);
    if(!update){ throw new Error("update failed"); }

    const verify = await categoryService.findOne(testCategoryId);
    if(!verify){ throw new Error("category to verify is null"); }

    expect(verify.name).toEqual("UPDATED_NAME");
    expect(update.name).toEqual("UPDATED_NAME");
  });

  it('should remove one test category, its units of measure should have null category', async () => {
    const category = await categoryService.findOne(testCategoryId, ['units']);
    expect(category).not.toBeNull();

    const removal = await categoryService.remove(testCategoryId);
    expect(removal).toBeTruthy();

    const verify = await categoryService.findOne(testCategoryId);
    expect(verify).toBeNull();

    const unitId = category?.units[0].id;
    if(!unitId){ throw new Error('unitId is null'); }
    const unit = await unitService.findOne(unitId);
    expect(unit?.category).toBeUndefined();
  });
});