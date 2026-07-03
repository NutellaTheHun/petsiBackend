import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleValidator } from './role.validator';

const P = `t${Date.now()}`;

describe('role validator', () => {
    let testingUtil: RoleTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: RoleValidator;
    let roleRepo: Repository<Role>;

    let roles: Role[];

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule();
        testingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        validator = module.get<RoleValidator>(RoleValidator);
        roleRepo = module.get(getRepositoryToken(Role));

        ({ roles } = await testingUtil.seedRoles(P));
    });

    afterAll(async () => {
        await roleRepo.delete(roles.map((r) => r.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateRoleDto = plainToInstance(CreateRoleDto, {
            name: `${P}-new-role-name`,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateRoleDto = plainToInstance(CreateRoleDto, {
            name: roles[0].name,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateRoleDto = plainToInstance(UpdateRoleDto, {
            name: `${P}-updated-role-name`,
        });

        const errors = await validator.validateDto(dto, roles[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const roleToUpdate = roles[0];
        const existingRole = roles[1];

        const dto: UpdateRoleDto = plainToInstance(UpdateRoleDto, {
            name: existingRole.name,
        });

        const errors = await validator.validateDto(dto, roleToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
