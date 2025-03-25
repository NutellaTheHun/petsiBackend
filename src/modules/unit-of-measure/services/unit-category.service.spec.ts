import { TestingModule } from '@nestjs/testing';
import { UnitCategoryService } from './unit-category.service';
import { UnitCategoryFactory } from '../factories/unit-category.factory';
import { UnitCategory } from '../entities/unit-category.entity';
import { OUNCE, POUND, UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { UnitOfMeasureFactory } from '../factories/unit-of-measure.factory';


describe('UnitCategoryService', () => {
  let categoryService: UnitCategoryService;
  let categoryFactory: UnitCategoryFactory;

  let testCategories: UnitCategory[];
  let testCategoryId: number;

  let unitService: UnitOfMeasureService;
  let unitFactory: UnitOfMeasureFactory;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();

    categoryService = module.get<UnitCategoryService>(UnitCategoryService);
    categoryFactory = module.get<UnitCategoryFactory>(UnitCategoryFactory);

    testCategories = await categoryFactory.getTestingUnitCategories();
    if(!testCategories) { throw new Error('categories is null'); }

    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    unitFactory = module.get<UnitOfMeasureFactory>(UnitOfMeasureFactory);
  });

  afterAll(async () => {
    const unitQueryBuilder = unitService.getQueryBuilder();
    await unitQueryBuilder.delete().execute();

    const categoryQueryBuilder = categoryService.getQueryBuilder();
    await categoryQueryBuilder.delete().execute();
  })

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  it('should insert test categories', async () => {
    let results: any[] = [];

    for (const category of testCategories){
      results.push(await categoryService.create(
        categoryFactory.createDtoInstance({ name: category.name })
      ));
    }

    expect(results).not.toBeNull();

    if(results[0]?.id){ testCategoryId = results[0].id; }

    expect(results.length).toEqual(testCategories.length);
    results.map(category => {
      expect(category).not.toBeNull();
      expect(category?.id).not.toBeNull();
    });
  });

  it('should retrieve all test categories', async () => {
    const results = await categoryService.findAll();
    expect(results.length).toEqual(testCategories.length);
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
    await unitService.initializeDefaultUnits();
    await categoryService.initializeDefaultCategoryBaseUnits();
    
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

    await unitService.update(unit.id,
      unitFactory.updateDtoInstance({
        categoryId: newCategory?.id,
      })
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