import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserService } from "../services/user.service";
import { USER_A, USER_B, USER_C } from "../utils/constants";
import { UserTestUtil } from "../utils/user-test.util";
import { getUserTestingModule } from "../utils/user-testing-module";
import { UserValidator } from "./user.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { EXIST } from "../../../util/exceptions/error_constants";

describe('user validator', () => {
    let testingUtil: UserTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: UserValidator;
    let service: UserService;

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();
        validator = module.get<UserValidator>(UserValidator);
        service = module.get<UserService>(UserService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UserTestUtil>(UserTestUtil);
        await testingUtil.initUserTestingDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            username: "testUser",
            password: "testPass",
            email: "email",
        } as CreateUserDto;

        await validator.validateCreate(dto);
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            username: USER_A,
            password: "pass",
            email: "email",
        } as CreateUserDto;

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
        const toUpdate = await service.findOneByName(USER_B);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            username: "testUser",
            password: "testPass",
            email: "email",
        } as UpdateUserDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(USER_B);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            username: USER_C,
            password: "testPass",
            email: "email",
        } as UpdateUserDto;

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