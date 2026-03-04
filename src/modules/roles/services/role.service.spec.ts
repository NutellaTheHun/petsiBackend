import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { ROLE_ADMIN } from '../utils/constants';
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

describe('Role Service', () => {
    let roleService: TestableRoleService;
    let roleTestingUtil: RoleTestUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let roleRepo: Repository<Role>;

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule({
            roleServiceClass: TestableRoleService,
        });
        roleService = module.get(RoleService) as TestableRoleService;
        dataSource = module.get(DataSource);
        roleRepo = module.get(getRepositoryToken(Role));
        dbTestContext = new DatabaseTestContext();
        roleTestingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        await roleTestingUtil.initRoleTestingDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(roleService).toBeDefined();
    });

    // test createEntity()
    it('should create role', async () => {
        const dto = plainToInstance(CreateRoleDto, { name: 'viewer' });

        await dataSource.transaction(async (manager) => {
            const result = await roleService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.name).toEqual(dto.name);
        });
    });

    // test updateEntity()
    it('should update role', async () => {
        const role = await roleRepo.findOne({ where: { name: ROLE_ADMIN } });
        if (!role) throw new Error('role not found');

        const dto = plainToInstance(UpdateRoleDto, { name: 'Admin Updated' });

        await dataSource.transaction(async (manager) => {
            await roleService.updateEntityForTest(dto, role, manager);
        });

        const result = await roleRepo.findOne({ where: { id: role.id } });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(dto.name);
    });

    // test findAll()
    it('should find all roles', async () => {
        const repoResult = await roleRepo.find();
        const serviceResult = await roleService.findAll();
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with sortBy name
    it('should find all roles with filter by name', async () => {
        const repoResult = await roleRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await roleService.findAll({
            sortBy: 'name',
            sortOrder: 'DESC',
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
        }
    });

    // test findOne()
    it('should find one role', async () => {
        const role = await roleRepo.find({ take: 1 });
        if (!role.length) throw new Error('role not found');

        const serviceResult = await roleService.findOne(role[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(role[0].id);
    });

    // test findOne() with relations
    it('should find one role with relations', async () => {
        const role = await roleRepo.find({ take: 1 });
        if (!role.length) throw new Error('role not found');

        const serviceResult = await roleService.findOne(role[0].id, ['users']);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(role[0].id);
        expect(serviceResult?.users).toBeDefined();
        expect(Array.isArray(serviceResult?.users)).toBe(true);
    });

    // test remove()
    it('should remove role', async () => {
        const role = await roleRepo.find({ take: 1 });
        if (!role.length) throw new Error('role not found');
        const id = role[0].id;

        const deleteResult = await roleService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(roleService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
