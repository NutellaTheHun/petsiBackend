import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import {
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_STAFF,
} from '../utils/constants';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleTestUtil } from '../utils/role-test.util';
import { RoleController } from './role.controller';

describe('RoleController', () => {
    let module: TestingModule;
    let dbTestContext: DatabaseTestContext;
    let testingUtil: RoleTestUtil;
    let controller: RoleController;
    let roleRepo: Repository<Role>;

    beforeAll(async () => {
        module = await getRoleTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get(RoleTestUtil);
        await testingUtil.initRoleTestingDatabase(dbTestContext);

        controller = module.get(RoleController);
        roleRepo = module.get(getRepositoryToken(Role));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await roleRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await roleRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            undefined,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns a seeded role', async () => {
        const row = await roleRepo.findOne({ where: { name: ROLE_ADMIN } });
        if (!row) throw new Error('seed role not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
        expect(result.name).toEqual(ROLE_ADMIN);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new role', async () => {
        const dto = plainToInstance(CreateRoleDto, {
            name: 'controller_role_create',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const persisted = await roleRepo.findOne({
            where: { name: 'controller_role_create' },
        });
        expect(persisted).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateRoleDto, { name: ROLE_ADMIN });
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

    it('update throws ValidationException when name collides with another role', async () => {
        const roles = await roleRepo.find();
        if (roles.length < 2) throw new Error('not enough roles');
        const dto = plainToInstance(UpdateRoleDto, {
            name: roles[1].name,
        });
        try {
            await controller.update(roles[0].id, dto);
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

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateRoleDto, { name: 'DoesNotMatter' });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                RoleService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current name', async () => {
            const role = await roleRepo.findOne({ where: { name: ROLE_STAFF } });
            if (!role) throw new Error('staff role not found');
            const dto = plainToInstance(UpdateRoleDto, { name: ROLE_STAFF });
            const result = await controller.update(role.id, dto);
            expect(result.name).toEqual(ROLE_STAFF);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const role = await roleRepo.findOne({ where: { name: ROLE_MANAGER } });
            if (!role) throw new Error('manager role not found');
            const newName = 'role_manager_ctrl_renamed';
            const dto = plainToInstance(UpdateRoleDto, { name: newName });
            const result = await controller.update(role.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await roleRepo.findOne({ where: { id: role.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created role then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateRoleDto, { name: 'controller_role_remove' }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
