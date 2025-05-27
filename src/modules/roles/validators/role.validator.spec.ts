import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { RoleService } from "../services/role.service";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../utils/constants";
import { RoleTestUtil } from "../utils/role-test.util";
import { getRoleTestingModule } from "../utils/role-testing-module";
import { RoleValidator } from "./role.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('role validator', () => {
    let testingUtil: RoleTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: RoleValidator;
    let service: RoleService;

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule();
        validator = module.get<RoleValidator>(RoleValidator);
        service = module.get<RoleService>(RoleService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        await testingUtil.initRoleTestingDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            roleName: "TEST NAME"
        } as CreateRoleDto;

        await validator.validateCreate(dto);
    });

    it('should fail create: name already exists', async () => {
        const dto = {
            roleName: ROLE_MANAGER
        } as CreateRoleDto;

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
        const toUpdate = await service.findOneByName(ROLE_ADMIN);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            roleName: "UPDATE TEST"
        } as UpdateRoleDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update: name already exists', async () => {
        const toUpdate = await service.findOneByName(ROLE_ADMIN);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            roleName: ROLE_STAFF
        } as UpdateRoleDto;

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