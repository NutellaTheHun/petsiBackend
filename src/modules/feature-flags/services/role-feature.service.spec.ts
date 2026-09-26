import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateRoleFeatureDto } from '../dto/create-role-feature.dto';
import { UpdateRoleFeatureDto } from '../dto/update-role-feature.dto';
import { RoleFeature } from '../entities/role-feature.entity';
import { getFeatureFlagsTestingModule } from '../utils/feature-flags-testing-module';
import { RoleFeatureService } from './role-feature.service';

class TestableRoleFeatureService extends RoleFeatureService {
    async createEntityForTest(
        dto: CreateRoleFeatureDto,
        manager: EntityManager,
    ): Promise<RoleFeature> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateRoleFeatureDto,
        entity: RoleFeature,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('RoleFeature Service', () => {
    let roleFeatureService: TestableRoleFeatureService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let roleFeatureRepo: Repository<RoleFeature>;
    let roleRepo: Repository<Role>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let role: Role;
    let otherTenantRole: Role;
    let otherTenantRoleFeature: RoleFeature;

    beforeAll(async () => {
        const module: TestingModule = await getFeatureFlagsTestingModule({
            roleFeatureServiceClass: TestableRoleFeatureService,
        });
        roleFeatureService = module.get(RoleFeatureService) as TestableRoleFeatureService;
        dataSource = module.get(DataSource);
        roleFeatureRepo = module.get(getRepositoryToken(RoleFeature));
        roleRepo = module.get(getRepositoryToken(Role));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        otherTenant = await tenantRepo.save({
            name: `${P}-other-tenant`,
            subdomain: `${P}-other-subdomain`,
        });
        requestContext.setContext({ tenantId: tenant.id });

        role = await roleRepo.save({ name: `${P}-role`, tenantId: tenant.id } as Role);
        otherTenantRole = await roleRepo.save({
            name: `${P}-other-tenant-role`,
            tenantId: otherTenant.id,
        } as Role);
        otherTenantRoleFeature = await roleFeatureRepo.save({
            tenantId: otherTenant.id,
            roleId: otherTenantRole.id,
            feature: 'ORDER_MANAGEMENT',
        } as RoleFeature);
    });

    afterAll(async () => {
        await roleFeatureRepo.delete([otherTenantRoleFeature.id]);
        await roleRepo.delete([role.id, otherTenantRole.id]);
        await tenantRepo.delete([tenant.id, otherTenant.id]);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        requestContext.setContext({ tenantId: tenant.id });
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('role-feature lifecycle', () => {
        let roleFeature: RoleFeature;

        it('should create role feature', async () => {
            const dto = plainToInstance(CreateRoleFeatureDto, {
                roleId: role.id,
                feature: 'ORDER_MANAGEMENT',
            });
            await dataSource.transaction(async (manager) => {
                roleFeature = await roleFeatureService.createEntityForTest(dto, manager);
            });
            expect(roleFeature.id).toBeDefined();
            expect(roleFeature.roleId).toEqual(role.id);
            expect(roleFeature.feature).toEqual('ORDER_MANAGEMENT');
            expect(roleFeature.tenantId).toEqual(tenant.id);
        });

        it('updateEntity is a no-op (grants are added/removed, not edited)', async () => {
            const dto = plainToInstance(UpdateRoleFeatureDto, {});
            await dataSource.transaction(async (manager) => {
                await roleFeatureService.updateEntityForTest(dto, roleFeature, manager);
            });
            const result = await roleFeatureRepo.findOneOrFail({ where: { id: roleFeature.id } });
            expect(result.feature).toEqual('ORDER_MANAGEMENT');
            expect(result.roleId).toEqual(role.id);
        });

        it('should remove role feature', async () => {
            const deleteResult = await roleFeatureService.remove(roleFeature.id);
            expect(deleteResult).toBe(true);
            await expect(roleFeatureService.findOne(roleFeature.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(roleFeatureService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('tenant scoping', () => {
        it('create stamps the caller tenant, not client input', async () => {
            const created = await roleFeatureService.create(
                plainToInstance(CreateRoleFeatureDto, {
                    roleId: role.id,
                    feature: 'INVENTORY_MANAGEMENT',
                }),
            );
            expect((created as RoleFeature).tenantId).toBe(tenant.id);
            await roleFeatureRepo.delete(created.id);
        });

        it('findOne throws NotFoundException for an id belonging to a different tenant', async () => {
            await expect(roleFeatureService.findOne(otherTenantRoleFeature.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
