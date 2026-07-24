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
import { OrderContainerItem } from '../../orders/entities/order-container-item.entity';
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
    let menuItem2: MenuItem;
    let menuItemSize: MenuItemSize;
    let menuItemCategory: MenuItemCategory;
    let orderAlice: Order;
    let orderBob: Order;
    let orderFrozen: Order;
    let orderMenuItemAlice: OrderMenuItem;
    let orderMenuItemBob: OrderMenuItem;
    let orderContainerItemRepo: Repository<OrderContainerItem>;

    beforeAll(async () => {
        module = await getReportsExecutionTestingModule();
        service = module.get(ReportExecutionService);
        definitionRepo = module.get(getRepositoryToken(ReportDefinition));
        orderRepo = module.get(getRepositoryToken(Order));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        orderContainerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        testContextService = module.get(RequestContextService) as TestRequestContextService;

        menuItemCategory = await menuItemCategoryRepo.save({ name: `${P}-pie` });
        menuItemSize = await menuItemSizeRepo.save({ name: `${P}-regular` });
        menuItem = await menuItemRepo.save({ name: `${P}-apple-pie` });
        menuItem2 = await menuItemRepo.save({ name: `${P}-cherry-pie` });

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
        orderMenuItemBob = await orderMenuItemRepo.save({
            menuItem: menuItem2,
            size: menuItemSize,
            quantity: 3,
            parentOrder: orderBob,
        });

        testContextService.run(() => {}, { roles: [ROLE_MANAGER] });
    });

    afterAll(async () => {
        await orderMenuItemRepo.delete([orderMenuItemAlice.id, orderMenuItemBob.id]);
        await orderRepo.delete([orderAlice.id, orderBob.id, orderFrozen.id]);
        await menuItemRepo.delete([menuItem.id, menuItem2.id]);
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

    describe('aggregated table section (groupBy + aggregates)', () => {
        it('groups by itemName and returns correct sum per group', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Qty by Item',
                    entity: 'orderMenuItems',
                    columns: [{ fieldKey: 'itemName' }],
                    filters: [],
                    groupBy: ['itemName'],
                    aggregates: [{ fieldKey: 'quantity', fn: 'sum', label: 'totalQty' }],
                },
            ]);

            const result = await service.execute(defn.id, {});
            const section = result.sections[0] as any;

            expect(section.type).toBe('table');
            expect(section.columns).toContainEqual({ key: 'itemName', label: 'Item Name', dataType: 'string' });
            expect(section.columns).toContainEqual({ key: 'totalQty', label: 'totalQty', dataType: 'number' });

            const appleRow = section.rows.find((r: any) => r.itemName === `${P}-apple-pie`);
            expect(appleRow).toBeDefined();
            expect(Number(appleRow.totalQty)).toBe(2);

            const cherryRow = section.rows.find((r: any) => r.itemName === `${P}-cherry-pie`);
            expect(cherryRow).toBeDefined();
            expect(Number(cherryRow.totalQty)).toBe(3);
        });

        it('one row per unique grouped field combination', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Grouped Items',
                    entity: 'orderMenuItems',
                    columns: [{ fieldKey: 'itemName' }, { fieldKey: 'sizeName' }],
                    filters: [],
                    groupBy: ['itemName', 'sizeName'],
                    aggregates: [{ fieldKey: 'quantity', fn: 'count', label: 'itemCount' }],
                },
            ]);

            const result = await service.execute(defn.id, {});
            const section = result.sections[0] as any;

            const appleRow = section.rows.find((r: any) => r.itemName === `${P}-apple-pie`);
            const cherryRow = section.rows.find((r: any) => r.itemName === `${P}-cherry-pie`);
            expect(appleRow).toBeDefined();
            expect(cherryRow).toBeDefined();
            expect(Number(appleRow.itemCount)).toBe(1);
            expect(Number(cherryRow.itemCount)).toBe(1);
        });
    });

    describe('metric section', () => {
        it('returns metric values matching known seeded aggregates', async () => {
            const defn = await createDefinition([
                {
                    type: 'metric',
                    order: 1,
                    title: 'Summary',
                    entity: 'orderMenuItems',
                    columns: [],
                    filters: [],
                    aggregates: [
                        { fieldKey: 'quantity', fn: 'sum', label: 'Total Quantity' },
                        { fieldKey: 'quantity', fn: 'count', label: 'Item Count' },
                    ],
                },
            ]);

            const result = await service.execute(defn.id, {});
            const section = result.sections[0] as any;

            expect(section.type).toBe('metric');
            expect(section.title).toBe('Summary');
            expect(section.metrics).toHaveLength(2);

            const totalQtyMetric = section.metrics.find((m: any) => m.label === 'Total Quantity');
            expect(totalQtyMetric).toBeDefined();
            expect(Number(totalQtyMetric.value)).toBe(5); // 2 (alice) + 3 (bob)

            const itemCountMetric = section.metrics.find((m: any) => m.label === 'Item Count');
            expect(itemCountMetric).toBeDefined();
            expect(Number(itemCountMetric.value)).toBe(2);
        });

        it('fixed filter scopes metric aggregation to matching rows', async () => {
            const defn = await createDefinition([
                {
                    type: 'metric',
                    order: 1,
                    title: 'Apple Pie Only',
                    entity: 'orderMenuItems',
                    columns: [],
                    filters: [
                        {
                            source: 'fixed',
                            field: 'itemName',
                            operator: '=',
                            value: `${P}-apple-pie`,
                        },
                    ],
                    aggregates: [{ fieldKey: 'quantity', fn: 'sum', label: 'totalQty' }],
                },
            ]);

            const result = await service.execute(defn.id, {});
            const section = result.sections[0] as any;

            expect(section.type).toBe('metric');
            const metric = section.metrics.find((m: any) => m.label === 'totalQty');
            expect(metric).toBeDefined();
            expect(Number(metric.value)).toBe(2);
        });

        it('param filter scopes metric aggregation', async () => {
            const defn = await createDefinition([
                {
                    type: 'metric',
                    order: 1,
                    title: 'Filtered Qty',
                    entity: 'orderMenuItems',
                    columns: [],
                    filters: [
                        {
                            source: 'param',
                            field: 'itemName',
                            operator: '=',
                            paramName: 'item',
                        },
                    ],
                    aggregates: [{ fieldKey: 'quantity', fn: 'sum', label: 'totalQty' }],
                },
            ]);

            const result = await service.execute(defn.id, { item: `${P}-cherry-pie` });
            const section = result.sections[0] as any;

            expect(section.type).toBe('metric');
            const metric = section.metrics.find((m: any) => m.label === 'totalQty');
            expect(Number(metric.value)).toBe(3);
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

    describe('nested children (orderMenuItems with container sub-items)', () => {
        it('container row includes children array with correct sub-item fields', async () => {
            const containerOrder = await orderRepo.save({
                recipient: `${P}-container-order`,
                fulfillmentDate: DATE_1,
                fulfillmentType: 'pickup',
                isFrozen: false,
            });
            testCtx.addCleanupFunction(async () => { await orderRepo.delete(containerOrder.id); });

            const containerOrderMenuItem = await orderMenuItemRepo.save({
                menuItem,
                size: menuItemSize,
                quantity: 1,
                parentOrder: containerOrder,
                containerOrderMenuItems: [
                    { containedMenuItem: menuItem, containedItemSize: menuItemSize, quantity: 2 },
                    { containedMenuItem: menuItem2, containedItemSize: menuItemSize, quantity: 3 },
                ],
            } as any);
            testCtx.addCleanupFunction(async () => { await orderMenuItemRepo.delete(containerOrderMenuItem.id); });

            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'Items with sub-items',
                    entity: 'orderMenuItems',
                    columns: [
                        { fieldKey: 'itemName' },
                        { fieldKey: 'sizeName' },
                        { fieldKey: 'quantity' },
                        { fieldKey: 'children' },
                    ],
                    filters: [],
                },
            ]);

            const result = await service.execute(defn.id, {});
            const section = result.sections[0] as any;

            const containerRow = section.rows.find(
                (r: any) => r.itemName === `${P}-apple-pie` && Number(r.quantity) === 1,
            );
            expect(containerRow).toBeDefined();
            expect(containerRow.children).toHaveLength(2);

            const childWithQty2 = containerRow.children.find((c: any) => Number(c.quantity) === 2);
            expect(childWithQty2).toBeDefined();
            expect(childWithQty2.itemName).toBe(`${P}-apple-pie`);
            expect(childWithQty2.sizeName).toBe(`${P}-regular`);

            const childWithQty3 = containerRow.children.find((c: any) => Number(c.quantity) === 3);
            expect(childWithQty3).toBeDefined();
            expect(childWithQty3.itemName).toBe(`${P}-cherry-pie`);
            expect(childWithQty3.sizeName).toBe(`${P}-regular`);
        });

        it('non-container rows have an empty children array', async () => {
            const defn = await createDefinition([
                {
                    type: 'table',
                    order: 1,
                    title: 'All Items',
                    entity: 'orderMenuItems',
                    columns: [
                        { fieldKey: 'itemName' },
                        { fieldKey: 'children' },
                    ],
                    filters: [],
                },
            ]);

            const result = await service.execute(defn.id, {});
            const section = result.sections[0] as any;

            // All seeded rows (alice + bob) have no container sub-items
            for (const row of section.rows) {
                expect(Array.isArray(row.children)).toBe(true);
                expect(row.children).toHaveLength(0);
            }
        });
    });
});
