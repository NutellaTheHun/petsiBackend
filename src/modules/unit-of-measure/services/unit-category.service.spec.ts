import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';
import { OUNCE, POUND, UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { CreateUnitCategoryDto } from '../dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from '../dto/update-unit-category.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';


describe('UnitCategoryService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let categoryService: UnitCategoryService;
  let unitService: UnitOfMeasureService;

  let testId: number;
  let testIds: number[];

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

  it('should create a category', async () => {
    const dto = {
      name: "testCategory",
    } as CreateUnitCategoryDto;

    const result = await categoryService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testCategory");

    testId = result?.id as number;
  });

  it('should fail to create a category (already exists)', async () => {
    const dto = {
      name: "testCategory",
    } as CreateUnitCategoryDto;


    await expect(categoryService.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should find one category', async () => {
    const result = await categoryService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testCategory");
    expect(result?.id).toEqual(testId);
  });

  it('should fail to find one category (doesnt exist)', async () => {
    const result = await categoryService.findOne(0);
    expect(result).toBeNull();
  });

  it('should find one category by name', async () => {
    const result = await categoryService.findOneByName("testCategory");
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testCategory");
    expect(result?.id).toEqual(testId);
  });

  it('should fail to find one category by name (doesnt exist)', async () => {
    const result = await categoryService.findOneByName("");
    expect(result).toBeNull();
  });

  it('should fail to update category (category not found)', async () => {
    const dto = {
      name: "updateName"
    } as UpdateUnitCategoryDto;

    await expect(categoryService.update(0, dto)).rejects.toThrow(NotFoundException);
  })

  it('should update category name', async () => {
    const dto = {
      name: "updateName"
    } as UpdateUnitCategoryDto;

    const result = await categoryService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("updateName");
  })

  it('should update category baseUnit', async () => {
    const unit = await unitService.findOneByName(POUND);
    if(!unit){ throw new Error("unit of measure not found"); }

    const dto = {
      baseUnitId: unit?.id,
    } as UpdateUnitCategoryDto;

    const result = await categoryService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("updateName");
    expect(result?.baseUnit?.id).toEqual(unit?.id);
    expect(result?.baseUnit?.name).toEqual(POUND);
  })

  it('should set baseUnit to null when unit is deleted', async () => {
    const unit = await unitService.findOneByName(POUND);
    if(!unit){ throw new Error("unit of measure not found"); }

    const removal = await unitService.remove(unit.id);
    if(!removal){ throw new Error("unit of measure removal failed"); }

    const category = await categoryService.findOne(testId, ["baseUnit"]);
    if(!category){ throw new Error("category not found"); }
    expect(category.baseUnit).toBeNull();
  });

  it('should remove a category', async () => {
    const removal = await categoryService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await categoryService.findOne(testId);
    expect(verify).toBeNull();
  })

  it('should fail to remove a category (not found)', async () => {
    const removal = await categoryService.remove(testId);
    expect(removal).toBeFalsy();
  })

  it('should find all categories', async () => {
    const expected = await testingUtil.getCategoryEntities(dbTestContext);

    const results = await categoryService.findAll();

    expect(results.items.length).toEqual(expected.length);
    testIds = [ results.items[0].id, results.items[1].id, results.items[2].id,]
  });

  it('should find categories by list of ids', async () => {
    const results = await categoryService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
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
    const unitToRemove = await unitService.findOneByName(OUNCE, ['category']);
    if(!unitToRemove){ throw new Error('unit not found.'); }
    if(!unitToRemove.category?.id){ throw new Error('unit has no category'); }

    await unitService.remove(unitToRemove.id);

    const category = await categoryService.findOne(unitToRemove.category.id, ['units']);
    if(!category) { throw new Error('category not found'); }

    expect(category.units.findIndex(unit => unit.id == unitToRemove.id)).toEqual(-1);
  });
});