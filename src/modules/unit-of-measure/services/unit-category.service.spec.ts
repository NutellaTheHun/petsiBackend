import { TestingModule } from '@nestjs/testing';
import { UnitCategoryService } from './unit-category.service';
import { UnitCategoryFactory } from '../factories/unit-category.factory';
import { UnitCategory } from '../entities/unit-category.entity';
import { WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { clear } from 'console';


describe('UnitCategoryService', () => {
  let service: UnitCategoryService;
  let factory: UnitCategoryFactory;
  let testCategories: UnitCategory[];
  let testCategoryId: number;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();

    service = module.get<UnitCategoryService>(UnitCategoryService);
    factory = module.get<UnitCategoryFactory>(UnitCategoryFactory);
    testCategories = await factory.getTestingRoles();
    if(!testCategories) { throw new Error('categories is null'); }
  });

  afterAll(async () => {
    const queryBuilder = service.getQueryBuilder();
    await queryBuilder.delete().execute();
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should insert test categories', async () => {
    const results = await Promise.all(
      testCategories.map( category => 
        service.create(
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
    const results = await service.findAll();
    expect(results.length).toEqual(testCategories.length);
  });

  it('should retrieve one test category', async() => {
    const result = await service.findOne(testCategoryId);
    expect(result).not.toBeNull();
  });

  it('should retrieve one test category by name', async() => {
    const result = await service.findOneByName(WEIGHT);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(WEIGHT);
  });

  it('should update one test category', async() => {
    const category = await service.findOne(testCategoryId);
    if(!category){ throw new Error("category is null"); }

    category.name = "UPDATED_NAME";
    const update = await service.update(category.id, category);
    if(!update){ throw new Error("update failed"); }

    const verify = await service.findOne(testCategoryId);
    if(!verify){ throw new Error("category to verify is null"); }

    expect(verify.name).toEqual("UPDATED_NAME");
    expect(update.name).toEqual("UPDATED_NAME");
  });

  it('should remove one test category', async () => {
    const category = await service.findOne(testCategoryId);
    expect(category).not.toBeNull();

    const removal = await service.remove(testCategoryId);
    expect(removal).toBeTruthy();

    const verify = await service.findOne(testCategoryId);
    expect(verify).toBeNull();
  });

  //setCategoryBaseUnit()
});