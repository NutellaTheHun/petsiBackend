import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateUnitOfMeasureCategoryDto } from "../dto/unit-of-measure-category/create-unit-of-measure-category.dto";
import { UpdateUnitOfMeasureCategoryDto } from "../dto/unit-of-measure-category/update-unit-of-measure-category.dto";
import { UnitOfMeasureCategoryService } from "../services/unit-of-measure-category.service";
import { VOLUME, WEIGHT } from "../utils/constants";
import { getUnitOfMeasureTestingModule } from "../utils/unit-of-measure-testing-module";
import { UnitOfMeasureTestingUtil } from "../utils/unit-of-measure-testing.util";
import { UnitOfMeasureCategoryValidator } from "./unit-of-measure-category.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('unit of measure category validator', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: UnitOfMeasureCategoryValidator;
    let service: UnitOfMeasureCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getUnitOfMeasureTestingModule();
        validator = module.get<UnitOfMeasureCategoryValidator>(UnitOfMeasureCategoryValidator);
        service = module.get<UnitOfMeasureCategoryService>(UnitOfMeasureCategoryService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(UnitOfMeasureTestingUtil);
        await testingUtil.initUnitCategoryTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            categoryName: "TEST NAME"
        } as CreateUnitOfMeasureCategoryDto;

        await validator.validateCreate(dto);
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            categoryName: VOLUME
        } as CreateUnitOfMeasureCategoryDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(WEIGHT);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            categoryName: "TEST NAME"
        } as UpdateUnitOfMeasureCategoryDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(WEIGHT);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            categoryName: VOLUME
        } as UpdateUnitOfMeasureCategoryDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });
});