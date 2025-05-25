import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateUnitOfMeasureDto } from "../dto/unit-of-measure/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/unit-of-measure/update-unit-of-measure.dto";
import { UnitOfMeasureCategoryService } from "../services/unit-of-measure-category.service";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import { FL_OUNCE, GALLON, GRAM, OUNCE_ABBREV, UNIT } from "../utils/constants";
import { getUnitOfMeasureTestingModule } from "../utils/unit-of-measure-testing-module";
import { UnitOfMeasureTestingUtil } from "../utils/unit-of-measure-testing.util";
import { UnitOfMeasureValidator } from "./unit-of-measure.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('unit of measure validator', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: UnitOfMeasureValidator;
    let unitService: UnitOfMeasureService;
    let categoryService: UnitOfMeasureCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getUnitOfMeasureTestingModule();
        validator = module.get<UnitOfMeasureValidator>(UnitOfMeasureValidator);
        unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
        categoryService = module.get<UnitOfMeasureCategoryService>(UnitOfMeasureCategoryService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(UnitOfMeasureTestingUtil);
        await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should pass update', async () => {
        const toUpdate = await unitService.findOneByName(GRAM);
        if (!toUpdate) { throw new Error(); }

        const category = await categoryService.findOneByName(UNIT);
        if (!category) { throw new Error(); }

        const dto = {
            unitName: "TEST UPDATE",
            abbreviation: "abbrev",
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as UpdateUnitOfMeasureDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeUndefined();
        }
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await unitService.findOneByName(GRAM);
        if (!toUpdate) { throw new Error(); }

        const category = await categoryService.findOneByName(UNIT);
        if (!category) { throw new Error(); }

        const dto = {
            unitName: FL_OUNCE,
            abbreviation: "abbrev",
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as UpdateUnitOfMeasureDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should fail update (abbrev already exists)', async () => {
        const toUpdate = await unitService.findOneByName(GRAM);
        if (!toUpdate) { throw new Error(); }

        const category = await categoryService.findOneByName(UNIT);
        if (!category) { throw new Error(); }

        const dto = {
            unitName: "TEST CREATE",
            abbreviation: OUNCE_ABBREV,
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as UpdateUnitOfMeasureDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should validate create', async () => {
        const category = await categoryService.findOneByName(UNIT);
        if (!category) { throw new Error(); }

        const dto = {
            unitName: "TEST ITEM",
            abbreviation: "ABREV",
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as CreateUnitOfMeasureDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeUndefined();
        }

    });

    it('should fail create (name already exists)', async () => {
        const category = await categoryService.findOneByName(UNIT);
        if (!category) { throw new Error(); }

        const dto = {
            unitName: GALLON,
            abbreviation: "ABREV",
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as CreateUnitOfMeasureDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should fail create (abbrev already exists)', async () => {
        const category = await categoryService.findOneByName(UNIT);
        if (!category) { throw new Error(); }

        const dto = {
            unitName: "TEST CREATE",
            abbreviation: OUNCE_ABBREV,
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as CreateUnitOfMeasureDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });


});