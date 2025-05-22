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

    it('should validate create', async () => {
        const category = await categoryService.findOneByName(UNIT);
        if(!category){ throw new Error(); }

        const dto = {
            unitName: "TEST ITEM",
            abbreviation: "ABREV", 
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as CreateUnitOfMeasureDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const category = await categoryService.findOneByName(UNIT);
        if(!category){ throw new Error(); }

        const dto = {
            unitName: GALLON,
            abbreviation: "ABREV", 
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as CreateUnitOfMeasureDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Unit of measure with name ${GALLON} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await unitService.findOneByName(GRAM);
        if(!toUpdate){ throw new Error(); }

        const category = await categoryService.findOneByName(UNIT);
        if(!category){ throw new Error(); }

        const dto = {
            unitName: "TEST UPDATE",
            abbreviation: "abbrev", 
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as UpdateUnitOfMeasureDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await unitService.findOneByName(GRAM);
        if(!toUpdate){ throw new Error(); }
        
        const category = await categoryService.findOneByName(UNIT);
        if(!category){ throw new Error(); }

        const dto = {
            unitName: FL_OUNCE,
            abbreviation: "abbrev", 
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as UpdateUnitOfMeasureDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Unit of measure with name ${FL_OUNCE} already exists`);
    });

    it('should fail create (abbrev already exists)', async () => {
        const category = await categoryService.findOneByName(UNIT);
        if(!category){ throw new Error(); }

        const dto = {
            unitName: "TEST CREATE",
            abbreviation: OUNCE_ABBREV, 
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as CreateUnitOfMeasureDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Unit of measure with abbreviation ${OUNCE_ABBREV} already exists`);
    });

    it('should fail update (abbrev already exists)', async () => {
        const toUpdate = await unitService.findOneByName(GRAM);
        if(!toUpdate){ throw new Error(); }

        const category = await categoryService.findOneByName(UNIT);
        if(!category){ throw new Error(); }

        const dto = {
            unitName: "TEST CREATE",
            abbreviation: OUNCE_ABBREV, 
            categoryId: category.id,
            conversionFactorToBase: "1234",
        } as UpdateUnitOfMeasureDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Unit of measure with abbreviation ${OUNCE_ABBREV} already exists`);
    });
});