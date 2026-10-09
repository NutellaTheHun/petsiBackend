import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { MenuItemCategory } from '../../modules/menu-items/entities/menu-item-category.entity';
import { MenuItem } from '../../modules/menu-items/entities/menu-item.entity';
import { MenuItemCategoryService } from '../../modules/menu-items/services/menu-item-category.service';
import { MenuItemCategoryValidator } from '../../modules/menu-items/validators/menu-item-category.validator';
import { AppHttpException } from './app-http-exception';
import { DatabaseError } from './database-error';
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

describe('database and server error mapping (HTTP)', () => {
    let app: INestApplication;
    let logger: RecordingLogger;
    let tenantRepo: Repository<Tenant>;
    let categoryRepo: Repository<MenuItemCategory>;
    let categoryService: MenuItemCategoryService;
    let categoryValidator: MenuItemCategoryValidator;
    let tenant: Tenant;
    let existingCategory: MenuItemCategory;
    const userId = 4242;

    const forbiddenBodyContent = ['databaseError', 'originalError', 'detail', 'SELECT', 'secret'];

    function expectNoInternals(body: unknown) {
        const serialized = JSON.stringify(body);
        for (const fragment of forbiddenBodyContent) {
            expect(serialized).not.toContain(fragment);
        }
    }

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        tenantRepo = module.get(getRepositoryToken(Tenant));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        categoryService = module.get(MenuItemCategoryService);
        categoryValidator = module.get(MenuItemCategoryValidator);
        const requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-db-tenant`, subdomain: `${P}-db-subdomain` });
        requestContext.setContext({ tenantId: tenant.id, userId });
        existingCategory = await categoryRepo.save({ tenantId: tenant.id, name: `${P}-taken` });

        ({ app, logger } = await createHttpTestApp(module));
    });

    afterAll(async () => {
        await categoryRepo.delete(existingCategory.id);
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => logger.clear());
    afterEach(() => jest.restoreAllMocks());

    it('maps a unique violation that slipped past the validator to 409 ALREADY_EXISTS', async () => {
        // Simulates the race where a concurrent request inserted the name after validation
        jest.spyOn(categoryValidator, 'validateDto').mockResolvedValueOnce(null);

        const res = await request(app.getHttpServer())
            .post('/menu-item-categories')
            .send({ name: `${P}-taken` })
            .expect(409);

        expect(res.body).toEqual(
            expect.objectContaining({
                statusCode: 409,
                code: 'ALREADY_EXISTS',
                requestId: res.headers['x-request-id'],
            }),
        );
        expect(res.body.details).toBeUndefined();
        expectNoInternals(res.body);
        expect(JSON.stringify(res.body)).not.toContain(`${P}-taken`);

        expect(logger.logs).toHaveLength(1);
        expect(logger.logs[0].level).toBe('info');
        expect(logger.logs[0].payload).toEqual(
            expect.objectContaining({
                requestId: res.headers['x-request-id'],
                method: 'POST',
                route: '/menu-item-categories',
                userId,
                tenantId: tenant.id,
                constraint: expect.any(String),
            }),
        );
        expect(JSON.stringify(logger.logs[0].payload)).not.toContain(`${P}-taken`);
    });

    it('maps a foreign-key violation to 409 REFERENCE_CONFLICT', async () => {
        // Simulates a referenced row deleted between resolution and save
        jest.spyOn(categoryService as any, 'createEntity').mockImplementationOnce(
            async (_dto: any, manager: any) =>
                manager.save(
                    (manager as EntityManager).create(MenuItem, {
                        tenantId: tenant.id,
                        name: `${P}-orphan`,
                        category: { id: 9_999_999 },
                    }),
                ),
        );

        const res = await request(app.getHttpServer())
            .post('/menu-item-categories')
            .send({ name: `${P}-fk` })
            .expect(409);

        expect(res.body).toEqual(
            expect.objectContaining({
                statusCode: 409,
                code: 'REFERENCE_CONFLICT',
                requestId: res.headers['x-request-id'],
            }),
        );
        expect(res.body.details).toBeUndefined();
        expectNoInternals(res.body);

        expect(logger.logs).toHaveLength(1);
        expect(logger.logs[0].level).toBe('warn');
        expect(logger.logs[0].payload).toEqual(
            expect.objectContaining({
                requestId: res.headers['x-request-id'],
                constraint: expect.any(String),
                table: expect.any(String),
            }),
        );
    });

    it('masks an unexpected Error as 500 INTERNAL_ERROR and logs it with a stack', async () => {
        jest.spyOn(categoryService, 'findOne').mockRejectedValueOnce(
            new Error('secret internal failure'),
        );

        const res = await request(app.getHttpServer())
            .get('/menu-item-categories/12345')
            .expect(500);

        expect(res.body).toEqual(
            expect.objectContaining({
                statusCode: 500,
                code: 'INTERNAL_ERROR',
                requestId: res.headers['x-request-id'],
            }),
        );
        expect(res.body.details).toBeUndefined();
        expectNoInternals(res.body);

        expect(logger.logs).toHaveLength(1);
        const entry = logger.logs[0];
        expect(entry.level).toBe('error');
        expect(entry.payload).toEqual(
            expect.objectContaining({
                source: 'server',
                requestId: res.headers['x-request-id'],
                method: 'GET',
                route: '/menu-item-categories/:id',
                userId,
                tenantId: tenant.id,
                err: expect.objectContaining({
                    message: 'secret internal failure',
                    stack: expect.stringContaining('secret internal failure'),
                }),
            }),
        );
    });

    it('masks an unclassified database error and logs its Postgres code and detail', async () => {
        const queryError = new QueryFailedError('SELECT secret FROM nowhere', ['secret-param'], {
            code: '42P01',
            detail: 'secret pg detail',
            message: 'relation "nowhere" does not exist',
        } as any);
        jest.spyOn(categoryService, 'findOne').mockRejectedValueOnce(
            DatabaseError.fromTypeOrmError(queryError),
        );

        const res = await request(app.getHttpServer())
            .get('/menu-item-categories/12346')
            .expect(500);

        expect(res.body.code).toBe('INTERNAL_ERROR');
        expect(res.body.details).toBeUndefined();
        expectNoInternals(res.body);

        expect(logger.logs).toHaveLength(1);
        expect(logger.logs[0].level).toBe('error');
        expect(logger.logs[0].payload).toEqual(
            expect.objectContaining({
                pgCode: '42P01',
                pgDetail: 'secret pg detail',
                err: expect.objectContaining({ stack: expect.any(String) }),
            }),
        );
        // SQL parameters are request values and must not be logged
        expect(JSON.stringify(logger.logs[0].payload)).not.toContain('secret-param');
    });

    it('masks the message of a 5xx HttpException', async () => {
        jest.spyOn(categoryService, 'findOne').mockRejectedValueOnce(
            new AppHttpException('secret config missing', HttpStatus.INTERNAL_SERVER_ERROR, 'X', { secret: 1 }),
        );

        const res = await request(app.getHttpServer())
            .get('/menu-item-categories/12347')
            .expect(500);

        expect(res.body.code).toBe('INTERNAL_ERROR');
        expect(res.body.details).toBeUndefined();
        expectNoInternals(res.body);
        expect(logger.logs).toHaveLength(1);
        expect(logger.logs[0].level).toBe('error');
    });

    it('returns 404 without logging when updating a missing id', async () => {
        const res = await request(app.getHttpServer())
            .put('/menu-item-categories/9999999')
            .send({ name: `${P}-missing` })
            .expect(404);

        expect(res.body.requestId).toBe(res.headers['x-request-id']);
        expectNoInternals(res.body);
        expect(logger.logs).toHaveLength(0);
    });

    it('does not log a 404 from findOne', async () => {
        const res = await request(app.getHttpServer())
            .get('/menu-item-categories/9999999')
            .expect(404);

        expectNoInternals(res.body);
        expect(logger.logs).toHaveLength(0);
    });
});
