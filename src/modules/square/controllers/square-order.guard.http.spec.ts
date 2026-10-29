import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TestUser } from '../../../test/test-user-guard';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { Order } from '../../orders/entities/order.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';

const P = `t${Date.now()}`;

/**
 * Access and wiring for Detach: an admin or manager at the order's location.
 * Detach behaviour is covered by `square-order-ingest.service.spec.ts`.
 */
describe('square order controller (location scope + wiring)', () => {
    let app: INestApplication;
    let orderRepo: Repository<Order>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let otherLocation: Location;
    let currentUser: TestUser | undefined;

    const at = (locationId: number, ...roles: string[]): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId, roles }],
    });

    beforeAll(async () => {
        const module: TestingModule = await getSquareTestingModule();
        orderRepo = module.get(getRepositoryToken(Order));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({
            tenant,
            locations: [location, otherLocation],
        } = await module.get(LocationTestUtil).seedLocations(P, undefined, 2));

        ({ app } = await createHttpTestApp(module, {
            user: () => currentUser,
        }));
    });

    afterAll(async () => {
        await locationRepo.delete({ tenantId: tenant.id });
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        currentUser = at(location.id, 'manager');
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function seedLinkedOrder(): Promise<Order> {
        const order = await orderRepo.save({
            tenantId: tenant.id,
            locationId: location.id,
            recipient: `${P} Jane`,
            fulfillmentDate: new Date('2026-11-02T15:00:00Z'),
            fulfillmentType: 'pickup',
        });
        testCtx.addCleanupFunction(async () => {
            await orderRepo.delete({ tenantId: tenant.id });
        });
        await orderLinkRepo.save({
            tenantId: tenant.id,
            squareOrderId: `${P}-order`,
            squareVersion: '1',
            squareLocationId: `${P}-sq-loc`,
            orderId: order.id,
            lineMap: { 'l-1': [1] },
        });
        testCtx.addCleanupFunction(async () => {
            await orderLinkRepo.delete({ tenantId: tenant.id });
        });
        return order;
    }

    const detach = (orderId: number, locationId = location.id) =>
        request(app.getHttpServer()).post(
            `/square/locations/${locationId}/orders/${orderId}/detach`,
        );

    const linkStatus = async () =>
        (
            await orderLinkRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareOrderId: `${P}-order`,
            })
        ).status;

    it.each([
        ['a manager at the location', () => at(location.id, 'manager')],
        ['an admin at the location', () => at(location.id, 'admin')],
        [
            'a tenant admin',
            (): TestUser => ({
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            }),
        ],
    ])('lets %s detach', async (_label, user) => {
        const order = await seedLinkedOrder();
        currentUser = user();
        expect((await detach(order.id)).status).toBe(204);
        expect(await linkStatus()).toBe('detached');
    });

    it.each([
        ['staff at the location', () => at(location.id, 'staff')],
        [
            'a manager at another location',
            () => at(otherLocation.id, 'manager'),
        ],
        [
            'a tenant without SQUARE_INTEGRATION',
            (): TestUser => ({ ...at(location.id, 'manager'), features: [] }),
        ],
    ])('rejects %s with 403', async (_label, user) => {
        const order = await seedLinkedOrder();
        currentUser = user();
        expect((await detach(order.id)).status).toBe(403);
        expect(await linkStatus()).toBe('linked');
    });

    it('rejects an unauthenticated caller with 401', async () => {
        const order = await seedLinkedOrder();
        currentUser = undefined;
        expect((await detach(order.id)).status).toBe(401);
    });

    it('404s through another location the caller manages, leaving the link linked', async () => {
        const order = await seedLinkedOrder();
        currentUser = {
            ...at(location.id, 'manager'),
            locations: [
                { locationId: location.id, roles: ['manager'] },
                { locationId: otherLocation.id, roles: ['manager'] },
            ],
        };
        expect((await detach(order.id, otherLocation.id)).status).toBe(404);
        expect(await linkStatus()).toBe('linked');
    });

    it('404s an order not imported from Square', async () => {
        const order = await orderRepo.save({
            tenantId: tenant.id,
            locationId: location.id,
            recipient: `${P} Walk-in`,
            fulfillmentDate: new Date('2026-11-02T15:00:00Z'),
            fulfillmentType: 'pickup',
        });
        testCtx.addCleanupFunction(async () => {
            await orderRepo.delete({ id: order.id });
        });
        expect((await detach(order.id)).status).toBe(404);
    });
});
