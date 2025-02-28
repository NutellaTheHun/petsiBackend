import { TestingModule } from '@nestjs/testing';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { UnitOfMeasureFactory } from '../factories/unit-of-measure.factory';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { GRAM } from '../utils/constants';

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
      testUnits = await unitFactory.getTestingRoles();
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

  //convert

});
