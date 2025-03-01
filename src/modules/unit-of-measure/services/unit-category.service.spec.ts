import { TestingModule } from '@nestjs/testing';
import { UnitCategoryService } from './unit-category.service';
import { UnitCategoryFactory } from '../factories/unit-category.factory';
import { UnitCategory } from '../entities/unit-category.entity';
import { UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureService } from './unit-of-measure.service';


describe('UnitCategoryService', () => {
  let categoryService: UnitCategoryService;
  let factory: UnitCategoryFactory;
  let testCategories: UnitCategory[];
  let testCategoryId: number;

  let unitService: UnitOfMeasureService;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();

    categoryService = module.get<UnitCategoryService>(UnitCategoryService);
    factory = module.get<UnitCategoryFactory>(UnitCategoryFactory);

    testCategories = await factory.getTestingRoles();
    if(!testCategories) { throw new Error('categories is null'); }

    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
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
    const results = await Promise.all(
      testCategories.map( category => 
        categoryService.create(
          factory.createDtoInstance({ name: category.name })
        )
      )
    );
    expect(results).not.toBeNull();
    if(results[0]?.id){ testCategoryId = results[0].id; }

    expect(results.length).toEqual(testCategories.length);
    results.map(category => {
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
    
    const weight = await categoryService.findOneByName(WEIGHT, ['baseUnit']);
    expect(weight).not.toBeNull();
    expect(weight?.baseUnit).not.toBeNull();

    const volume = await categoryService.findOneByName(VOLUME, ['baseUnit']);
    expect(volume).not.toBeNull();
    expect(volume?.baseUnit).not.toBeNull();

    const unit = await categoryService.findOneByName(UNIT, ['baseUnit']);
    expect(unit).not.toBeNull();
    expect(unit?.baseUnit).not.toBeNull();
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

  it('should remove one test category', async () => {
    const category = await categoryService.findOne(testCategoryId);
    expect(category).not.toBeNull();

    const removal = await categoryService.remove(testCategoryId);
    expect(removal).toBeTruthy();

    const verify = await categoryService.findOne(testCategoryId);
    expect(verify).toBeNull();
  });
});