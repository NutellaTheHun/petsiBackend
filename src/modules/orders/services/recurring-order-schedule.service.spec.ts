import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Order } from '../entities/order.entity';
import { RecurringOrderSchedule } from '../entities/recurring-order-schedule.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { RecurringOrderScheduleService } from './recurring-order-schedule.service';

/**
 * All recurring order schedule create/update flows go through the order
 * entity (see order.service.spec.ts) — RecurringOrderScheduleService's own
 * create()/update() are unused on any live path (no dedicated controller).
 * This file only proves it inherited LocationScopedServiceBase's tenant/
 * location scoping on findOne(), per the multi-tenancy-support PRD's
 * testing decisions.
 */
describe('RecurringOrderScheduleService', () => {
    let testingUtil: OrderTestingUtil;
    let service: RecurringOrderScheduleService;
    let requestContext: TestRequestContextService;
    let orderRepo: Repository<Order>;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    let fixtureTenantId: number;
    let fixtureLocationId: number;
    let order: Order;
    let schedule: RecurringOrderSchedule;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        service = module.get<RecurringOrderScheduleService>(RecurringOrderScheduleService);
        requestContext = module.get(RequestContextService) as TestRequestContextService;
        orderRepo = module.get(getRepositoryToken(Order));
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));

        fixtureTenantId = await testingUtil.getDefaultTenantId();
        fixtureLocationId = await testingUtil.getDefaultLocationId();

        order = await orderRepo.save({
            recipient: `recurring-order-schedule-spec-${Date.now()}`,
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            isFrozen: false,
            tenantId: fixtureTenantId,
            locationId: fixtureLocationId,
        } as Order);
        schedule = await recurringOrderScheduleRepo.save({
            order,
            rrule: 'DTSTART:20260101T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
            startDate: new Date('2026-01-01'),
            timezone: 'America/New_York',
            tenantId: fixtureTenantId,
            locationId: fixtureLocationId,
        } as RecurringOrderSchedule);
    });

    afterAll(async () => {
        await recurringOrderScheduleRepo.delete(schedule.id);
        await orderRepo.delete(order.id);
    });

    describe('tenant/location scoping (inherited from LocationScopedServiceBase)', () => {
        it('findOne throws NotFoundException for a schedule belonging to a different tenant', async () => {
            requestContext.setContext({
                tenantId: fixtureTenantId + 999_999,
                isTenantAdmin: true,
                locations: [],
            });

            await expect(service.findOne(schedule.id)).rejects.toThrow(NotFoundException);
        });

        it('findOne rejects a non-admin caller not assigned to the schedule\'s location, isTenantAdmin bypasses that check', async () => {
            requestContext.setContext({
                tenantId: fixtureTenantId,
                isTenantAdmin: false,
                locations: [],
            });
            await expect(service.findOne(schedule.id)).rejects.toThrow(NotFoundException);

            requestContext.setContext({
                tenantId: fixtureTenantId,
                isTenantAdmin: true,
                locations: [],
            });
            const result = await service.findOne(schedule.id);
            expect(result.id).toBe(schedule.id);
        });
    });
});
