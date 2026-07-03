import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { roleToUpdateDto } from '../utils/entity-transformers/role.dto.transformer';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleService } from './role.service';

class TestableRoleService extends RoleService {
    async createEntityForTest(
        dto: CreateRoleDto,
        manager: EntityManager,
    ): Promise<Role> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateRoleDto,
        entity: Role,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Role Service', () => {
    let roleTestingUtil: RoleTestUtil;
    let roleService: TestableRoleService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let roleRepo: Repository<Role>;

    let roles: Role[];

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule({
            roleServiceClass: TestableRoleService,
        });
        roleTestingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        roleService = module.get(RoleService) as TestableRoleService;
        dataSource = module.get(DataSource);
        roleRepo = module.get(getRepositoryToken(Role));

        ({ roles } = await roleTestingUtil.seedRoles(P));
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

    describe('role lifecycle', () => {
        let role: Role;

        it('should create role', async () => {
            const dto = plainToInstance(CreateRoleDto, { name: `${P}-role-create` });
            await dataSource.transaction(async (manager) => {
                role = await roleService.createEntityForTest(dto, manager);
            });
            expect(role.id).toBeDefined();
            expect(role.name).toEqual(dto.name);
        });

        it('should update role', async () => {
            const dto = plainToInstance(UpdateRoleDto, { name: `${P}-role-updated` });
            await dataSource.transaction(async (manager) => {
                await roleService.updateEntityForTest(dto, role, manager);
            });
            const result = await roleRepo.findOneOrFail({ where: { id: role.id } });
            expect(result.name).toEqual(dto.name);
        });

        it('should remove role', async () => {
            const deleteResult = await roleService.remove(role.id);
            expect(deleteResult).toBe(true);
            await expect(roleService.findOne(role.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded role in findAll results', async () => {
        const result = await roleService.findAll();
        const found = result.items.find((r) => r.id === roles[0].id);
        expect(found).toBeDefined();
    });

    it('should find one role with relations', async () => {
        const result = await roleService.findOne(roles[0].id, ['users']);
        expect(result.id).toEqual(roles[0].id);
        expect(Array.isArray(result.users)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(roleService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(RoleService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const role = roles[0];
            const dto = roleToUpdateDto(role);
            await roleService.update(role.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const role = roles[1];
            const dto = roleToUpdateDto(role, { name: `${P}-role-renamed` });
            await roleService.update(role.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await roleRepo.findOneOrFail({ where: { id: role.id } });
            expect(row.name).toEqual(`${P}-role-renamed`);
        });
    });
});
