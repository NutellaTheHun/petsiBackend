import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ROLE_ADMIN } from '../utils/constants';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleService } from './role.service';


describe('Role Service', () => {
    let roleService: RoleService;
    let roleTestingUtil: RoleTestUtil;
    let dbTestContext: DatabaseTestContext;

    const testRoleName = "testRole";
    const testRoleUpdateName = "updateTestRole";
    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule();
        roleService = module.get<RoleService>(RoleService);

        dbTestContext = new DatabaseTestContext();
        roleTestingUtil = module.get<RoleTestUtil>(RoleTestUtil);
        await roleTestingUtil.initRoleTestingDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    })

    it('should be defined', () => {
        expect(roleService).toBeDefined();
    });

    it('should create a role', async () => {
        const dto = {
            roleName: testRoleName,
        } as CreateRoleDto;
        const result = await roleService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.roleName).toEqual(testRoleName);

        testId = result?.id as number;
    });

    it("should update a role", async () => {
        const dto = {
            roleName: testRoleUpdateName,
        } as UpdateRoleDto;

        const result = await roleService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.roleName).toEqual(testRoleUpdateName);
    });

    it('should remove a role', async () => {
        const removal = await roleService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(roleService.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it("should retrieve all roles", async () => {
        const expected = await roleTestingUtil.getTestRoleEntities(dbTestContext);

        const results = await roleService.findAll()

        expect(results.items.length).toEqual(expected.length);

        testIds = [results.items[0].id, results.items[1].id];
    });

    it("should sort all roles", async () => {
        const expected = await roleTestingUtil.getTestRoleEntities(dbTestContext);

        const results = await roleService.findAll({ sortBy: 'roleName' })

        expect(results.items.length).toEqual(expected.length);
    });

    it("should get Roles from a list of ids", async () => {
        const results = await roleService.findEntitiesById(testIds);
        if (!results) { throw new Error("results is null"); }

        expect(results.length).toEqual(testIds.length);
        for (const result of results) {
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
        }
    });

    it("should get role by name", async () => {
        const result = await roleService.findOneByName(ROLE_ADMIN);
        expect(result).not.toBeNull();
        expect(result?.roleName).toBe(ROLE_ADMIN);
    });
});
