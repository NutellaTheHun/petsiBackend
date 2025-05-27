import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateLabelTypeDto } from "../dto/label-type/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/label-type/update-label-type.dto";
import { LabelTypeService } from "../services/label-type.service";
import { type_a, type_b } from "../utils/constants";
import { getLabelsTestingModule } from "../utils/label-testing.module";
import { LabelTestingUtil } from "../utils/label-testing.util";
import { LabelTypeValidator } from "./label-type.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('label type validator', () => {
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: LabelTypeValidator;
    let service: LabelTypeService;

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule();
        validator = module.get<LabelTypeValidator>(LabelTypeValidator);
        service = module.get<LabelTypeService>(LabelTypeService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        await testingUtil.initLabelTypeTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            labelTypeName: "LABEL TYPE TEST",
            labelTypeLength: 100,
            labelTypeWidth: 100,
        } as CreateLabelTypeDto;

        await validator.validateCreate(dto);
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            labelTypeName: type_a,
            labelTypeLength: 100,
            labelTypeWidth: 100,
        } as CreateLabelTypeDto;

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
        const toUpdate = await service.findOneByName(type_b);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            labelTypeName: "LABEL TYPE TEST",
            labelTypeLength: 100,
            labelTypeWidth: 100,
        } as UpdateLabelTypeDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(type_b);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            labelTypeName: type_a,
            labelTypeLength: 100,
            labelTypeWidth: 100,
        } as UpdateLabelTypeDto;

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