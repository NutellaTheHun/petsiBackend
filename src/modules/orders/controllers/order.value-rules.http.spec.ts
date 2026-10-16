import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
    ValidationErrorResponse,
} from '../../../common/validation/validation-error';
import {
    createHttpTestApp,
    RecordingLogger,
} from '../../../test/http-test-app';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import {
    TestUser,
    useTestUserAndRoleGuards,
} from '../../../test/test-user-guard';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderCategory } from '../entities/order-category.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';

const P = `t${Date.now()}`;

/**
 * The DTO checks only shape, type and dropdown membership; rules about a value the
 * user types (e.g. quantity > 0) belong to the business validator. A zero quantity
 * must therefore reach the validator and come back as a field-level `OUT_OF_RANGE`,
 * while a wrong type or an unknown dropdown value stays an `INVALID_REQUEST`.
 */
describe('order value rules vs DTO shape (HTTP)', () => {
    let app: INestApplication;
    let logger: RecordingLogger;
    let locationId: number;

    let categoryRepo: Repository<OrderCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let menuItemRepo: Repository<MenuItem>;
    let category: OrderCategory;
    let size: MenuItemSize;
    let menuItem: MenuItem;

    const body = (item: Record<string, unknown>, overrides = {}) => ({
        recipient: `${P}-recipient`,
        fulfillmentDate: new Date().toISOString(),
        fulfillmentType: 'pickup',
        isFrozen: false,
        isWeekly: false,
        categoryId: category.id,
        locationId,
        orderedItems: [
            {
                createId: 'c1',
                menuItemId: menuItem.id,
                sizeId: size.id,
                ...item,
            },
        ],
        ...overrides,
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

        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));

        category = await categoryRepo.save({
            tenantId,
            name: `${P}-order-cat`,
        });
        size = await sizeRepo.save({ tenantId, name: `${P}-size` });
        menuItem = await menuItemRepo.save({
            tenantId,
            name: `${P}-single`,
            type: MENU_ITEM_TYPES.SINGLE,
            sizes: [size],
        });

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
        await menuItemRepo.delete(menuItem.id);
        await sizeRepo.delete(size.id);
        await categoryRepo.delete(category.id);
        await app.close();
    });

    beforeEach(() => logger.clear());

    it('returns OUT_OF_RANGE on the item quantity for a zero quantity, and logs nothing', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send(body({ quantity: 0 }));

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                code: 'VALIDATION_ERROR',
                requestId: res.get('x-request-id'),
            }),
        );
        const errors = (
            res.body as {
                details: { validationErrors: ValidationErrorResponse };
            }
        ).details.validationErrors;
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'orderedItems', id: 'c1' }],
            createValidationErrorPayload('OUT_OF_RANGE', undefined, [
                'quantity',
            ]),
        );
        expect(logger.logs).toHaveLength(0);
    });

    it('still rejects a non-numeric quantity as INVALID_REQUEST', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send(body({ quantity: `${P}-not-a-number` }));

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                code: 'INVALID_REQUEST',
                details: { fields: ['orderedItems.0.quantity'] },
            }),
        );
    });

    it('rejects an unknown fulfillmentType at the DTO as INVALID_REQUEST', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send(body({ quantity: 1 }, { fulfillmentType: 'teleport' }));

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                code: 'INVALID_REQUEST',
                details: { fields: ['fulfillmentType'] },
            }),
        );
    });
});
