import { ForbiddenException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppHttpException } from '../../../common/exceptions/app-http-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { ReportDefinition, ReportVisibility } from '../entities/report-definition.entity';
import { getReportsExecutionTestingModule } from '../reports-testing.module';
import { ReportExecutionService } from './report-execution.service';

const P = `t${Date.now()}`;

const DATE_1 = new Date('2025-01-15T00:00:00.000Z');
const DATE_2 = new Date('2025-01-16T00:00:00.000Z');

describe('ReportExecutionService', () => {
    let module: TestingModule;
    let service: ReportExecutionService;
    let definitionRepo: Repository<ReportDefinition>;
    let orderRepo: Repository<Order>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemSizeRepo: Repository<MenuItemSize>;
    let menuItemCategoryRepo: Repository<MenuItemCategory>;
    let testContextService: TestRequestContextService;
    let testCtx: DatabaseTestContext;

    let menuItem: MenuItem;
    let menuItemSize: MenuItemSize;
    let menuItemCategory: MenuItemCategory;
    let orderAlice: Order;
    let orderBob: Order;
    let orderFrozen: Order;
    let orderMenuItemAlice: OrderMenuItem;

    beforeAll(async () => {
        module = await getReportsExecutionTestingModule();
        service = module.get(ReportExecutionService);
        definitionRepo = module.get(getRepositoryToken(ReportDefinition));
        orderRepo = module.get(getRepositoryToken(Order));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        testContextService = module.get(RequestContextService) as TestRequestContextService;

        menuItemCategory = await menuItemCategoryRepo.save({ name: `${P}-pie` });
        menuItemSize = await menuItemSizeRepo.save({ name: `${P}-regular` });
        menuItem = await menuItemRepo.save({ name: `${P}-apple-pie` });

        orderAlice = await orderRepo.save({
            recipient: `${P}-alice`,
            fulfillmentDate: DATE_1,
            fulfillmentType: 'pickup',
            isFrozen: false,
        });
        orderBob = await orderRepo.save({
            recipient: `${P}-bob`,
            fulfillmentDate: DATE_2,
            fulfillmentType: 'delivery',
            isFrozen: false,
        });
        orderFrozen = await orderRepo.save({
            recipient: `${P}-frozen`,
            fulfillmentDate: DATE_1,
            fulfillmentType: 'pickup',
            isFrozen: true,
        });

        orderMenuItemAlice = await orderMenuItemRepo.save({
            menuItem,
            size: menuItemSize,
            quantity: 2,
            parentOrder: orderAlice,
        });

        testContextService.run(() => {}, { roles: [ROLE_MANAGER] });
    });

    afterAll(async () => {
        await orderMenuItemRepo.delete(orderMenuItemAlice.id);
        await orderRepo.delete([orderAlice.id, orderBob.id, orderFrozen.id]);
        await menuItemRepo.delete(menuItem.id);
        await menuItemSizeRepo.delete(menuItemSize.id);
        await menuItemCategoryRepo.delete(menuItemCategory.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function createDefinition(
        sections: ReportDefinition['sections'],
        visibility: ReportVisibility = 'management',
    ): Promise<ReportDefinition> {
        const defn = await definitionRepo.save({
            name: `${P}-def-${Date.now()}`,
            visibility,
            showHeader: true,
            params: [],
            sections,
        });
        testCtx.addCleanupFunction(async () => { await definitionRepo.delete(defn.id); });
        return defn;
    }

    describe('orders table section', () => {
        it('returns correct columns and rows for all non-frozen orders', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'All Orders',
                    entity: 'orders',
                    columns: [{ fieldKey: 'recipient' }, { fieldKey: 'fulfillmentType' }],
                    filters: [],
                },
            ]);

            const result = await service.execute(defn.id, {});

            expect(result.reportId).toBe(defn.id);
            expect(result.name).toBe(defn.name);
            expect(result.sections).toHaveLength(1);

            const section = result.sections[0] as any;
            expect(section.type).toBe('table');
            expect(section.title).toBe('All Orders');
            expect(section.columns).toEqual([
                { key: 'recipient', label: 'Recipient Name', dataType: 'string' },
                { key: 'fulfillmentType', label: 'Fulfillment Type', dataType: 'enum' },
            ]);

            const recipients = section.rows.map((r: any) => r.recipient);
            expect(recipients).toContain(`${P}-alice`);
            expect(recipients).toContain(`${P}-bob`);
            expect(recipients).not.toContain(`${P}-frozen`);
        });

        it('date-param filter scopes rows to matching fulfillment date', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Orders by Date',
                    entity: 'orders',
                    columns: [{ fieldKey: 'recipient' }],
                    filters: [
                        {
                            source: 'param',
                            field: 'fulfillmentDate',
                            operator: '=',
                            paramName: 'date',
                        },
                    ],
                },
            ]);

            const result = await service.execute(defn.id, { date: DATE_1 });

            const section = result.sections[0] as any;
            const recipients = section.rows.map((r: any) => r.recipient);
            expect(recipients).toContain(`${P}-alice`);
            expect(recipients).not.toContain(`${P}-bob`);
            expect(recipients).not.toContain(`${P}-frozen`);
        });

        it('fixed filter excludes non-matching rows', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Pickup Orders',
                    entity: 'orders',
                    columns: [{ fieldKey: 'recipient' }],
                    filters: [
                        {
                            source: 'fixed',
                            field: 'fulfillmentType',
                            operator: '=',
                            value: 'pickup',
                        },
                    ],
                },
            ]);

            const result = await service.execute(defn.id, {});

            const section = result.sections[0] as any;
            const recipients = section.rows.map((r: any) => r.recipient);
            expect(recipients).toContain(`${P}-alice`);
            expect(recipients).not.toContain(`${P}-bob`);
            expect(recipients).not.toContain(`${P}-frozen`);
        });

        it('frozen orders are absent from all execution results', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Orders',
                    entity: 'orders',
                    columns: [{ fieldKey: 'recipient' }],
                    filters: [],
                },
            ]);

            const result = await service.execute(defn.id, {});

            const section = result.sections[0] as any;
            const recipients = section.rows.map((r: any) => r.recipient);
            expect(recipients).not.toContain(`${P}-frozen`);
        });

        it('unknown field key throws AppHttpException', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Bad',
                    entity: 'orders',
                    columns: [{ fieldKey: 'nonExistentField' }],
                    filters: [],
                },
            ]);

            await expect(service.execute(defn.id, {})).rejects.toThrow(AppHttpException);
        });
    });

    describe('orderMenuItems table section', () => {
        it('returns item rows keyed by field aliases with correct joins', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Order Items',
                    entity: 'orderMenuItems',
                    columns: [
                        { fieldKey: 'itemName' },
                        { fieldKey: 'sizeName' },
                        { fieldKey: 'quantity' },
                    ],
                    filters: [],
                },
            ]);

            const result = await service.execute(defn.id, {});

            const section = result.sections[0] as any;
            expect(section.type).toBe('table');
            expect(section.columns).toEqual([
                { key: 'itemName', label: 'Item Name', dataType: 'string' },
                { key: 'sizeName', label: 'Size', dataType: 'string' },
                { key: 'quantity', label: 'Quantity', dataType: 'number' },
            ]);
            const row = section.rows.find((r: any) => r.itemName === `${P}-apple-pie`);
            expect(row).toBeDefined();
            expect(row.sizeName).toBe(`${P}-regular`);
            expect(Number(row.quantity)).toBe(2);
        });
    });

    describe('text section', () => {
        it('passes through title and content without a DB query', async () => {
            const defn = await createDefinition([
                {
                    type: 'text',
                    order: 1,
                    title: 'Static Note',
                    content: 'This is static content',
                },
            ]);

            const result = await service.execute(defn.id, {});

            expect(result.sections[0]).toEqual({
                type: 'text',
                title: 'Static Note',
                content: 'This is static content',
            });
        });
    });

    describe('visibility enforcement', () => {
        it('staff role receives ForbiddenException for management-visibility definition', async () => {
            const defn = await createDefinition(
                [{ type: 'text', order: 1, title: 'T', content: 'c' }],
                'management',
            );

            testContextService.run(() => {}, { roles: [ROLE_STAFF] });
            await expect(service.execute(defn.id, {})).rejects.toThrow(ForbiddenException);
            testContextService.run(() => {}, { roles: [ROLE_MANAGER] });
        });
    });
});
