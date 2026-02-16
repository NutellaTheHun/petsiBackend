import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { ROLE_ADMIN } from '../utils/constants';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleValidator } from './role.validator';

describe('role validator', () => {
    let testingUtil: RoleTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: RoleValidator;
    let roleRepo: Repository<Role>;

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        await testingUtil.initRoleTestingDatabase(dbTestContext);

        validator = module.get<RoleValidator>(RoleValidator);

        roleRepo = module.get(getRepositoryToken(Role));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateRoleDto = {
            name: 'New Role Name',
        };

        const errors = await validator.validateDto(dto, 'root')
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateRoleDto = {
            name: ROLE_ADMIN,
        };

        const errors = await validator.validateDto(dto, 'root')
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const roleToUpdate = await roleRepo.findOne({ where: { name: ROLE_ADMIN } });
        if (!roleToUpdate) {
            throw new Error('role not found');
        }

        const dto: UpdateRoleDto = {
            name: 'Updated Role Name',
        };

        const errors = await validator.validateDto(dto, roleToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const roles = await roleRepo.find();
        if (roles.length < 2) {
            throw new Error('Not enough roles for test');
        }

        const roleToUpdate = roles[0];
        const existingRole = roles[1];

        const dto: UpdateRoleDto = {
            name: existingRole.name,
        };

        const errors = await validator.validateDto(dto, roleToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['name']),
        );
    });
});
