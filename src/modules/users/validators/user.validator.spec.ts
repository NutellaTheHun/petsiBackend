import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { UserTestUtil } from "../utils/user-test.util";
import { UserValidator } from "./user.validator";
import { UserService } from "../services/user.service";
import { getUserTestingModule } from "../utils/user-testing-module";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { USER_A, USER_B, USER_C } from "../utils/constants";

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

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            username: USER_A,
            password: "pass",
            email: "email",
        } as CreateUserDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`User with name ${USER_A} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(USER_B);
        if(!toUpdate){ throw new Error(); }

        const dto = {
            username: "testUser",
            password: "testPass",
            email: "email",
        } as UpdateUserDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(USER_B);
        if(!toUpdate){ throw new Error(); }

        const dto = {
            username: USER_C,
            password: "testPass",
            email: "email",
        } as UpdateUserDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`User with name ${USER_C} already exists`);
    });
});