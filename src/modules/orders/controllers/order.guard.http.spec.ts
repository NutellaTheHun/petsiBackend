import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import {
    TestUser,
    useTestUserAndRoleGuards,
} from '../../../test/test-user-guard';
import { RequestContextService } from '../../request-context/RequestContextService';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';

/**
 * Guard-only checks for `POST /orders`: the full create path is covered by
 * `order.service.spec.ts`. An incomplete body that reaches validation (400)
 * shows the request got past `RoleGuard`.
 */
describe('order controller (location scope enforcement)', () => {
    let app: INestApplication;
    let locationId: number;
    let currentUser: TestUser;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        const requestContext = module.get<TestRequestContextService>(
            RequestContextService,
        );
        const testingUtil = module.get(OrderTestingUtil);
        const tenantId = await testingUtil.getDefaultTenantId();
        locationId = await testingUtil.getDefaultLocationId();
        currentUser = {
            tenantId,
            isTenantAdmin: false,
            locations: [{ locationId, roles: ['staff'] }],
        };

        ({ app } = await createHttpTestApp(module, {
            beforeInit: useTestUserAndRoleGuards(
                () => currentUser,
                requestContext,
            ),
        }));
    });

    afterAll(async () => {
        await app.close();
    });

    it('rejects a locationId the caller is not assigned to with 403', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ locationId: 9_999_999 });
        expect(res.status).toBe(403);
    });

    it('rejects a body with no locationId with 403', async () => {
        const res = await request(app.getHttpServer()).post('/orders').send({});
        expect(res.status).toBe(403);
    });

    it('lets a caller assigned to the location through to validation', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ locationId });
        expect(res.status).toBe(400);
    });
});
