import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getMenuItemTestingModule } from '../../modules/menu-items/utils/menu-item-testing.module';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { createHttpTestApp, RecordingLogger } from '../../test/http-test-app';
import { TestRequestContextService } from '../../test/mocks/test-request-context.service';

const P = `t${Date.now()}`;

describe('error envelope + request id (HTTP)', () => {
    let app: INestApplication;
    let logger: RecordingLogger;
    let tenantRepo: Repository<Tenant>;
    let tenant: Tenant;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        tenantRepo = module.get(getRepositoryToken(Tenant));
        const requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ app, logger } = await createHttpTestApp(module));
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => logger.clear());

    it('returns an X-Request-Id header on a successful request', async () => {
        const res = await request(app.getHttpServer())
            .get('/menu-item-categories')
            .expect(200);

        expect(res.headers['x-request-id']).toEqual(expect.any(String));
        expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
    });

    it('returns the header on an error and puts the same id in the envelope', async () => {
        const res = await request(app.getHttpServer())
            .get('/menu-item-categories/9999999')
            .expect(404);

        const requestId = res.headers['x-request-id'];
        expect(requestId).toEqual(expect.any(String));
        expect(res.body).toEqual(
            expect.objectContaining({
                statusCode: 404,
                timestamp: expect.any(String),
                path: '/menu-item-categories/9999999',
                requestId,
            }),
        );
        expect(res.body).toHaveProperty('message');
    });

    it('echoes a client-supplied x-request-id in the header and error body', async () => {
        const clientId = `${P}-client-id`;

        const ok = await request(app.getHttpServer())
            .get('/menu-item-categories')
            .set('x-request-id', clientId)
            .expect(200);
        expect(ok.headers['x-request-id']).toBe(clientId);

        const err = await request(app.getHttpServer())
            .get('/menu-item-categories/9999999')
            .set('x-request-id', clientId)
            .expect(404);
        expect(err.headers['x-request-id']).toBe(clientId);
        expect(err.body.requestId).toBe(clientId);
    });

    it('generates a distinct id per request when none is supplied', async () => {
        const a = await request(app.getHttpServer()).get('/menu-item-categories');
        const b = await request(app.getHttpServer()).get('/menu-item-categories');
        expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']);
    });
});
