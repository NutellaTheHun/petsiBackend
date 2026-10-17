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
import { Location } from '../../locations/entities/location.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';

const P = `t${Date.now()}`;

type Fixture = {
    tenantId: number;
    locationId: number;
    category: OrderCategory;
    size: MenuItemSize;
    /** A second size on `menuItem`, so two line items don't collide as DUPLICATE_ITEMS. */
    altSize: MenuItemSize;
    menuItem: MenuItem;
};

/**
 * A nested `id` in an upsert must name an existing child of the parent being
 * updated. A missing row is `REFERENCE_NOT_FOUND`; a row under another parent
 * is `INVALID_REFERENCE` (or `REFERENCE_NOT_FOUND` when it's in another tenant,
 * so another tenant's data is never confirmed). Neither may reparent the row.
 */
describe('order nested id ownership (HTTP)', () => {
    let app: INestApplication;
    let logger: RecordingLogger;
    let currentUser: TestUser;

    let orderRepo: Repository<Order>;
    let orderItemRepo: Repository<OrderMenuItem>;
    let categoryRepo: Repository<OrderCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let menuItemRepo: Repository<MenuItem>;
    let tenantRepo: Repository<Tenant>;
    let locationRepo: Repository<Location>;

    let home: Fixture;
    let other: Fixture;
    const orderIds: number[] = [];

    const userFor = (f: Fixture): TestUser => ({
        tenantId: f.tenantId,
        isTenantAdmin: false,
        locations: [{ locationId: f.locationId, roles: ['staff'] }],
    });

    async function seedFixture(
        tenantId: number,
        locationId: number,
        tag: string,
    ) {
        const category = await categoryRepo.save({
            tenantId,
            name: `${P}-${tag}-order-cat`,
        });
        const size = await sizeRepo.save({
            tenantId,
            name: `${P}-${tag}-size`,
        });
        const altSize = await sizeRepo.save({
            tenantId,
            name: `${P}-${tag}-alt-size`,
        });
        const menuItem = await menuItemRepo.save({
            tenantId,
            name: `${P}-${tag}-single`,
            type: MENU_ITEM_TYPES.SINGLE,
            sizes: [size, altSize],
        });
        return { tenantId, locationId, category, size, altSize, menuItem };
    }

    const orderBody = (f: Fixture, recipient: string, items: object[]) => ({
        recipient,
        fulfillmentDate: new Date().toISOString(),
        fulfillmentType: 'pickup',
        isFrozen: false,
        isWeekly: false,
        categoryId: f.category.id,
        locationId: f.locationId,
        orderedItems: items,
    });

    /** A nested update item on `f`'s menu item. */
    const updateItem = (
        f: Fixture,
        id: number,
        quantity = 1,
        size = f.size,
    ) => ({
        id,
        menuItemId: f.menuItem.id,
        sizeId: size.id,
        quantity,
    });

    async function postOrder(
        f: Fixture,
        recipient: string,
        size = f.size,
    ): Promise<Order> {
        currentUser = userFor(f);
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send(
                orderBody(f, recipient, [
                    {
                        createId: 'c1',
                        menuItemId: f.menuItem.id,
                        sizeId: size.id,
                        quantity: 1,
                    },
                ]),
            );
        expect(res.status).toBe(201);
        const order = res.body as Order;
        orderIds.push(order.id);
        return order;
    }

    async function itemsOf(orderId: number): Promise<OrderMenuItem[]> {
        return orderItemRepo.find({
            where: { parentOrder: { id: orderId } },
        });
    }

    function putOrderedItems(order: Order, items: object[]) {
        currentUser = userFor(home);
        return request(app.getHttpServer())
            .put(`/orders/${order.id}`)
            .send(orderBody(home, order.recipient, items));
    }

    function validationErrors(res: request.Response): ValidationErrorResponse {
        return (
            res.body as {
                details: { validationErrors: ValidationErrorResponse };
            }
        ).details.validationErrors;
    }

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        const requestContext = module.get<
            RequestContextService,
            TestRequestContextService
        >(RequestContextService);
        const testingUtil = module.get(OrderTestingUtil);

        orderRepo = module.get(getRepositoryToken(Order));
        orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        locationRepo = module.get(getRepositoryToken(Location));

        home = await seedFixture(
            await testingUtil.getDefaultTenantId(),
            await testingUtil.getDefaultLocationId(),
            'home',
        );
        const otherTenant = await tenantRepo.save({
            name: `${P}-other-tenant`,
            subdomain: `${P}-other-subdomain`,
        });
        const otherLocation = await locationRepo.save({
            tenant: { id: otherTenant.id } as Tenant,
            name: `${P}-other-location`,
        });
        other = await seedFixture(otherTenant.id, otherLocation.id, 'other');

        currentUser = userFor(home);
        ({ app, logger } = await createHttpTestApp(module, {
            beforeInit: useTestUserAndRoleGuards(
                () => currentUser,
                requestContext,
            ),
        }));
    });

    afterAll(async () => {
        if (orderIds.length) await orderRepo.delete(orderIds);
        for (const f of [home, other]) {
            await menuItemRepo.delete(f.menuItem.id);
            await sizeRepo.delete([f.size.id, f.altSize.id]);
            await categoryRepo.delete(f.category.id);
        }
        await locationRepo.delete(other.locationId);
        await tenantRepo.delete(other.tenantId);
        await app.close();
    });

    beforeEach(() => logger.clear());

    it('returns REFERENCE_NOT_FOUND (not 500) for a nested id that does not exist, logged once at warn', async () => {
        const orderA = await postOrder(home, `${P}-a-missing`);

        const res = await putOrderedItems(orderA, [
            updateItem(home, 9_999_999, 2),
        ]);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                code: 'VALIDATION_ERROR',
            }),
        );
        const errors = validationErrors(res);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'orderedItems', id: 9_999_999 }],
            createValidationErrorPayload('REFERENCE_NOT_FOUND', undefined, [
                'id',
            ]),
        );

        expect(logger.logs.filter((l) => l.level === 'error')).toHaveLength(0);
        const warns = logger.logs.filter((l) => l.level === 'warn');
        expect(warns).toHaveLength(1);
        expect(warns[0].payload).toEqual(
            expect.objectContaining({
                source: 'business',
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        path: 'orderedItems[9999999]',
                        code: 'REFERENCE_NOT_FOUND',
                        value: 9_999_999,
                    }),
                ]) as unknown,
            }),
        );

        // order A is untouched
        const itemsA = await itemsOf(orderA.id);
        expect(itemsA).toHaveLength(1);
        expect(itemsA[0].quantity).toBe(1);
    });

    it("returns INVALID_REFERENCE for another order's item id and leaves that item on its order", async () => {
        const orderA = await postOrder(home, `${P}-a-cross`);
        const orderB = await postOrder(home, `${P}-b-cross`, home.altSize);
        const [itemB] = await itemsOf(orderB.id);
        const [itemA] = await itemsOf(orderA.id);

        const res = await putOrderedItems(orderA, [
            updateItem(home, itemA.id),
            updateItem(home, itemB.id, 7, home.altSize),
        ]);

        expect(res.status).toBe(400);
        const errors = validationErrors(res);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'orderedItems', id: itemB.id }],
            createValidationErrorPayload('INVALID_REFERENCE', undefined, [
                'id',
            ]),
        );

        const reloaded = await orderItemRepo.findOneOrFail({
            where: { id: itemB.id },
            relations: ['parentOrder'],
        });
        expect(reloaded.parentOrder.id).toBe(orderB.id);
        expect(reloaded.quantity).toBe(1);
        expect(await itemsOf(orderA.id)).toHaveLength(1);
    });

    it("rejects another tenant's item id without confirming it exists, and leaves it unchanged", async () => {
        const orderA = await postOrder(home, `${P}-a-tenant`);
        const orderB = await postOrder(other, `${P}-b-tenant`);
        const [itemB] = await itemsOf(orderB.id);

        const res = await putOrderedItems(orderA, [
            updateItem(home, itemB.id, 7),
        ]);

        expect(res.status).toBe(400);
        const errors = validationErrors(res);
        expectValidationErrorSize(errors, 1);
        // Same response as a row that doesn't exist at all.
        expectValidationErrorPayload(
            errors,
            [{ prop: 'orderedItems', id: itemB.id }],
            createValidationErrorPayload('REFERENCE_NOT_FOUND', undefined, [
                'id',
            ]),
        );

        const reloaded = await orderItemRepo.findOneOrFail({
            where: { id: itemB.id },
            relations: ['parentOrder'],
        });
        expect(reloaded.parentOrder.id).toBe(orderB.id);
        expect(reloaded.tenantId).toBe(other.tenantId);
        expect(reloaded.quantity).toBe(1);
    });

    // Create DTOs only accept nested creates, so this is a shape failure before the
    // validator's own create rule (any nested id is INVALID_REFERENCE) is reached.
    it('rejects a nested id on create as INVALID_REQUEST and leaves the item on its order', async () => {
        const orderB = await postOrder(home, `${P}-b-create`);
        const [itemB] = await itemsOf(orderB.id);

        currentUser = userFor(home);
        const res = await request(app.getHttpServer())
            .post('/orders')
            .send(
                orderBody(home, `${P}-create-with-id`, [
                    updateItem(home, itemB.id, 3),
                ]),
            );

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining<Record<string, unknown>>({
                code: 'INVALID_REQUEST',
            }),
        );
        const reloaded = await orderItemRepo.findOneOrFail({
            where: { id: itemB.id },
            relations: ['parentOrder'],
        });
        expect(reloaded.parentOrder.id).toBe(orderB.id);
    });
});
