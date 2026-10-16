import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import {
    createHttpTestApp,
    RecordingLogger,
} from '../../../test/http-test-app';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import {
    TestUser,
    useTestUserAndRoleGuards,
} from '../../../test/test-user-guard';
import { RequestContextService } from '../../request-context/RequestContextService';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';

const P = `t${Date.now()}`;

interface InvalidRequestBody {
    details: { fields: string[] };
}

interface DtoWarnPayload {
    constraints: { path: string; constraint: string }[];
}

/**
 * DTO shape failures (class-validator) over HTTP: 400 `INVALID_REQUEST` with flat
 * field paths, one `warn` log with `source: dto`, and no submitted values in either.
 * The pipe rejects before the service runs, so no order data is seeded.
 */
describe('order DTO shape failures (HTTP)', () => {
    let app: INestApplication;
    let logger: RecordingLogger;
    let locationId: number;

    const recipient = `${P}-recipient-Jane-Doe`;
    const badNumber = `${P}-not-a-number`;

    const validItem = { createId: 'c1', menuItemId: 1, sizeId: 1, quantity: 2 };
    const baseBody = () => ({
        recipient,
        fulfillmentDate: new Date().toISOString(),
        fulfillmentType: 'pickup',
        isFrozen: false,
        isWeekly: false,
        categoryId: 1,
        locationId,
        orderedItems: [validItem],
    });

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        const requestContext = module.get<
            RequestContextService,
            TestRequestContextService
        >(RequestContextService);
        const testingUtil = module.get(OrderTestingUtil);
        const tenantId = await testingUtil.getDefaultTenantId();
        locationId = await testingUtil.getDefaultLocationId();
        const currentUser: TestUser = {
            tenantId,
            isTenantAdmin: false,
            locations: [{ locationId, roles: ['staff'] }],
        };

        ({ app, logger } = await createHttpTestApp(module, {
            beforeInit: useTestUserAndRoleGuards(
                () => currentUser,
                requestContext,
            ),
        }));
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => logger.clear());

    const expectNoSubmittedValues = (text: string) => {
        expect(text).not.toContain(recipient);
        expect(text).not.toContain(badNumber);
    };

    const expectInvalidRequest = (res: request.Response) => {
        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                statusCode: 400,
                code: 'INVALID_REQUEST',
                message: "This request couldn't be processed",
                requestId: res.get('x-request-id'),
            }),
        );
        expectNoSubmittedValues(JSON.stringify(res.body));
        expect(JSON.stringify(res.body)).not.toContain('target');
        expect(JSON.stringify(res.body)).not.toContain('value');
    };

    // Assert the path under test is present rather than the exact list.
    const expectFields = (res: request.Response, path: string) => {
        const { fields } = (res.body as InvalidRequestBody).details;
        expect(fields).toContain(path);
        expect(new Set(fields).size).toBe(fields.length);
    };

    const expectSingleDtoWarning = (dto: string, paths: string[]) => {
        expect(logger.logs).toHaveLength(1);
        const [entry] = logger.logs;
        expect(entry.level).toBe('warn');
        expect(entry.payload).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                source: 'dto',
                dto,
                route: expect.stringContaining('/orders'),
                requestId: expect.any(String),
            }),
        );
        const { constraints } = entry.payload as DtoWarnPayload;
        for (const path of paths) {
            expect(constraints).toContainEqual<Record<string, unknown>>({
                path,
                constraint: expect.any(String),
            });
        }
        expectNoSubmittedValues(JSON.stringify(logger.logs));
    };

    it('reports a wrong-typed field by path without echoing the value or body', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ ...baseBody(), categoryId: badNumber });

        expectInvalidRequest(res);
        expectFields(res, 'categoryId');
        expectSingleDtoWarning('CreateOrderDto', ['categoryId']);
    });

    it('lists an unknown property', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ ...baseBody(), unknownProp: badNumber });

        expectInvalidRequest(res);
        expectFields(res, 'unknownProp');
        expectSingleDtoWarning('CreateOrderDto', ['unknownProp']);
    });

    it('reports a nested array item field with an index segment', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({
                ...baseBody(),
                orderedItems: [
                    validItem,
                    { ...validItem, createId: 'c2', quantity: badNumber },
                ],
            });

        expectInvalidRequest(res);
        expectFields(res, 'orderedItems.1.quantity');
        expectSingleDtoWarning('CreateOrderDto', ['orderedItems.1.quantity']);
    });

    it('de-duplicates a path that fails several constraints', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ ...baseBody(), categoryId: undefined });

        expectInvalidRequest(res);
        expectFields(res, 'categoryId');
        const { constraints } = logger.logs[0].payload as DtoWarnPayload;
        expect(constraints.length).toBeGreaterThan(1);
    });

    it('rejects a nested create item with neither id nor createId as a shape failure', async () => {
        const { createId: _omit, ...noIdentity } = validItem;
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ ...baseBody(), orderedItems: [noIdentity] });

        expectInvalidRequest(res);
        expectFields(res, 'orderedItems.0.createId');
        expectSingleDtoWarning('CreateOrderDto', ['orderedItems.0.createId']);
    });

    it('rejects a nested update item with neither id nor createId as a shape failure, not 500', async () => {
        const { createId: _omit, ...noIdentity } = validItem;
        const res = await request(app.getHttpServer())
            .put('/orders/9999999')
            .send({ ...baseBody(), orderedItems: [noIdentity] });

        expectInvalidRequest(res);
        expectFields(res, 'orderedItems.0.id');
        expectSingleDtoWarning('UpdateOrderDto', ['orderedItems.0.id']);
    });

    it('rejects a nested update item with id 0 as a shape failure, not 500', async () => {
        const { createId: _omit, ...noIdentity } = validItem;
        const res = await request(app.getHttpServer())
            .put('/orders/9999999')
            .send({ ...baseBody(), orderedItems: [{ ...noIdentity, id: 0 }] });

        expectInvalidRequest(res);
        expectFields(res, 'orderedItems.0.id');
    });
});
