import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { OUNCE, POUND, VOLUME } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryService } from './unit-of-measure-category.service';
import { UnitOfMeasureService } from './unit-of-measure.service';


describe('UnitOfMeasureCategoryService', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let categoryService: UnitOfMeasureCategoryService;
    let unitService: UnitOfMeasureService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getUnitOfMeasureTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(UnitOfMeasureTestingUtil);
        await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

        categoryService = module.get<UnitOfMeasureCategoryService>(UnitOfMeasureCategoryService);
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
            categoryName: "testCategory",
        } as CreateUnitOfMeasureCategoryDto;

        const result = await categoryService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("testCategory");

        testId = result?.id as number;
    });

    it('should fail to create a category (already exists)', async () => {
        const dto = {
            categoryName: "testCategory",
        } as CreateUnitOfMeasureCategoryDto;

        await expect(categoryService.create(dto)).rejects.toThrow(ValidationException);
    });

    it('should find one category', async () => {
        const result = await categoryService.findOne(testId);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("testCategory");
        expect(result?.id).toEqual(testId);
    });

    it('should fail to find one category (doesnt exist)', async () => {
        await expect(categoryService.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should find one category by name', async () => {
        const result = await categoryService.findOneByName("testCategory");
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("testCategory");
        expect(result?.id).toEqual(testId);
    });

    it('should fail to find one category by name (doesnt exist)', async () => {
        const result = await categoryService.findOneByName("");
        expect(result).toBeNull();
    });

    it('should fail to update category (category not found)', async () => {
        const dto = {
            categoryName: "updateName"
        } as UpdateUnitOfMeasureCategoryDto;

        await expect(categoryService.update(0, dto)).rejects.toThrow(Error);
    })

    it('should update category name', async () => {
        const dto = {
            categoryName: "updateName"
        } as UpdateUnitOfMeasureCategoryDto;

        const result = await categoryService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("updateName");
    })

    it('should update category baseUnit', async () => {
        const unit = await unitService.findOneByName(POUND);
        if (!unit) { throw new Error("unit of measure not found"); }

        const dto = {
            baseUnitId: unit?.id,
        } as UpdateUnitOfMeasureCategoryDto;

        const result = await categoryService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("updateName");
        expect(result?.baseConversionUnit?.id).toEqual(unit?.id);
        expect(result?.baseConversionUnit?.name).toEqual(POUND);
    })

    it('should set baseUnit to null when unit is deleted', async () => {
        const unit = await unitService.findOneByName(POUND);
        if (!unit) { throw new Error("unit of measure not found"); }

        const removal = await unitService.remove(unit.id);
        if (!removal) { throw new Error("unit of measure removal failed"); }

        const category = await categoryService.findOne(testId, ['baseConversionUnit']);
        if (!category) { throw new Error("category not found"); }
        expect(category.baseConversionUnit).toBeNull();
    });

    it('should remove a category', async () => {
        const removal = await categoryService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(categoryService.findOne(testId)).rejects.toThrow(NotFoundException);
    })

    it('should fail to remove a category (not found)', async () => {
        const removal = await categoryService.remove(testId);
        expect(removal).toBeFalsy();
    })

    it('should find all categories', async () => {
        const expected = await testingUtil.getCategoryEntities(dbTestContext);

        const results = await categoryService.findAll();

        expect(results.items.length).toEqual(expected.length);
        testIds = [results.items[0].id, results.items[1].id, results.items[2].id,]
    });

    it('should sort all categories', async () => {
        const expected = await testingUtil.getCategoryEntities(dbTestContext);

        const results = await categoryService.findAll({ sortBy: 'categoryName' });

        expect(results.items.length).toEqual(expected.length);
    });

    it('should find categories by list of ids', async () => {
        const results = await categoryService.findEntitiesById(testIds);
        expect(results.length).toEqual(testIds.length);
    });

    it('should update categories units list after unit changes category', async () => {
        const unit = await unitService.findOneByName(OUNCE, ['category']);
        if (!unit) { throw new Error('couldnt find unit'); }

        const oldCategoryId = unit?.category?.id;
        if (!oldCategoryId) { throw new Error('old category id is null'); }

        const newCategory = await categoryService.findOneByName(VOLUME);
        if (!newCategory) { throw new Error('couldnt find category'); }

        await unitService.update(
            unit.id,
            { categoryId: newCategory?.id } as UpdateUnitOfMeasureDto
        );

        const verifyNotInOld = await categoryService.findOne(oldCategoryId, ['unitsOfMeasure']);
        expect(verifyNotInOld?.unitsOfMeasure.find(u => u.id == unit.id)).toBeUndefined();

        const verifyInNew = await categoryService.findOne(newCategory.id, ['unitsOfMeasure']);
        expect(verifyInNew?.unitsOfMeasure.find(u => u.id == unit.id)).not.toBeUndefined();
    });

    it('should update category list after removing a unit of measure', async () => {
        const unitToRemove = await unitService.findOneByName(OUNCE, ['category']);
        if (!unitToRemove) { throw new Error('unit not found.'); }
        if (!unitToRemove.category?.id) { throw new Error('unit has no category'); }

        await unitService.remove(unitToRemove.id);

        const category = await categoryService.findOne(unitToRemove.category.id, ['unitsOfMeasure']);
        if (!category) { throw new Error('category not found'); }

        expect(category.unitsOfMeasure.findIndex(unit => unit.id == unitToRemove.id)).toEqual(-1);
    });
});