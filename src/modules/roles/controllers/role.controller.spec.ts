import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { Role } from '../entities/role.entity';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleController } from './role.controller';

const P = `t${Date.now()}`;

describe('RoleController', () => {
    let testingUtil: RoleTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: RoleController;
    let roleRepo: Repository<Role>;

    let roles: Role[];

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule();
        testingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        controller = module.get(RoleController);
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

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateRoleDto, { name: roles[0].name });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('remove deletes a created role then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateRoleDto, { name: `${P}-controller-role-remove` }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
