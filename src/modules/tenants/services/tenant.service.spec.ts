import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Tenant } from '../entities/tenant.entity';
import { tenantToUpdateDto } from '../utils/entity-transformers/tenant.dto.transformer';
import { getTenantsTestingModule } from '../utils/tenants-testing.module';
import { TenantTestUtil } from '../utils/tenant-test.util';
import { TenantService } from './tenant.service';

class TestableTenantService extends TenantService {
    async createEntityForTest(
        dto: CreateTenantDto,
        manager: EntityManager,
    ): Promise<Tenant> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateTenantDto,
        entity: Tenant,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Tenant Service', () => {
    let tenantTestUtil: TenantTestUtil;
    let tenantService: TestableTenantService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let tenantRepo: Repository<Tenant>;

    let tenants: Tenant[];

    beforeAll(async () => {
        const module: TestingModule = await getTenantsTestingModule({
            tenantServiceClass: TestableTenantService,
        });
        tenantTestUtil = module.get<TenantTestUtil>(TenantTestUtil);
        tenantService = module.get(TenantService) as TestableTenantService;
        dataSource = module.get(DataSource);
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({ tenants } = await tenantTestUtil.seedTenants(P));
    });

    afterAll(async () => {
        await tenantRepo.delete(tenants.map((t) => t.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('tenant lifecycle', () => {
        let tenant: Tenant;

        it('should create tenant', async () => {
            const dto = plainToInstance(CreateTenantDto, {
                name: `${P}-tenant-create`,
                subdomain: `${P}-subdomain-create`,
            });
            await dataSource.transaction(async (manager) => {
                tenant = await tenantService.createEntityForTest(dto, manager);
            });
            expect(tenant.id).toBeDefined();
            expect(tenant.name).toEqual(dto.name);
            expect(tenant.subdomain).toEqual(dto.subdomain);
        });

        it('should update tenant', async () => {
            const dto = plainToInstance(UpdateTenantDto, {
                name: `${P}-tenant-updated`,
                subdomain: `${P}-subdomain-updated`,
            });
            await dataSource.transaction(async (manager) => {
                await tenantService.updateEntityForTest(dto, tenant, manager);
            });
            const result = await tenantRepo.findOneOrFail({ where: { id: tenant.id } });
            expect(result.name).toEqual(dto.name);
            expect(result.subdomain).toEqual(dto.subdomain);
        });

        it('should remove tenant', async () => {
            const deleteResult = await tenantService.remove(tenant.id);
            expect(deleteResult).toBe(true);
            await expect(tenantService.findOne(tenant.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded tenant in findAll results', async () => {
        const result = await tenantService.findAll();
        const found = result.items.find((t) => t.id === tenants[0].id);
        expect(found).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(tenantService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(TenantService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when nothing changed', async () => {
            const tenant = tenants[0];
            const dto = tenantToUpdateDto(tenant);
            await tenantService.update(tenant.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const tenant = tenants[1];
            const dto = tenantToUpdateDto(tenant, { name: `${P}-tenant-renamed` });
            await tenantService.update(tenant.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await tenantRepo.findOneOrFail({ where: { id: tenant.id } });
            expect(row.name).toEqual(`${P}-tenant-renamed`);
        });
    });
});
