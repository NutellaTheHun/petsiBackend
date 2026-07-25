import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { TenantTestUtil } from '../../modules/tenants/utils/tenant-test.util';
import { getTenantsTestingModule } from '../../modules/tenants/utils/tenants-testing.module';
import { AppHttpException } from '../exceptions/app-http-exception';
import { TenantResolutionMiddleware } from './TenantResolutionMiddleware';

const P = `t${Date.now()}`;

describe('TenantResolutionMiddleware', () => {
    let testingUtil: TenantTestUtil;
    let tenantRepo: Repository<Tenant>;
    let middleware: TenantResolutionMiddleware;

    let tenant: Tenant;

    beforeAll(async () => {
        const module: TestingModule = await getTenantsTestingModule();
        testingUtil = module.get<TenantTestUtil>(TenantTestUtil);
        tenantRepo = module.get(getRepositoryToken(Tenant));
        middleware = new TenantResolutionMiddleware(tenantRepo);

        tenant = await testingUtil.seedTenant(P);
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
    });

    function buildReqRes(host: string | undefined) {
        const req: any = { headers: { host } };
        const res: any = {};
        const next = jest.fn();
        return { req, res, next };
    }

    it('resolves the correct tenant for a known subdomain and calls next', async () => {
        const { req, res, next } = buildReqRes(`${tenant.subdomain}.app.com`);

        await middleware.use(req, res, next);

        expect(req.tenant).toBeDefined();
        expect(req.tenant.id).toBe(tenant.id);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects an unrecognized subdomain before reaching a controller', async () => {
        const { req, res, next } = buildReqRes(`${P}-unknown-subdomain.app.com`);

        await expect(middleware.use(req, res, next)).rejects.toThrow(AppHttpException);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a host with no subdomain present', async () => {
        const { req, res, next } = buildReqRes('localhost');

        await expect(middleware.use(req, res, next)).rejects.toThrow(AppHttpException);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a missing host header', async () => {
        const { req, res, next } = buildReqRes(undefined);

        await expect(middleware.use(req, res, next)).rejects.toThrow(AppHttpException);
        expect(next).not.toHaveBeenCalled();
    });
});
