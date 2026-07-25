import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { RecurringOrderSchedule } from '../entities/recurring-order-schedule.entity';
import { getTestOrderCategoryNames } from './constants';
import { buildRRULEDateString } from './rrule.util';

@Injectable()
export class OrderTestingUtil {
    private orderTypeInit: boolean;
    private orderInit: boolean;
    private orderMenuItemInit: boolean;
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,
        @InjectRepository(OrderCategory)
        private readonly categoryRepo: Repository<OrderCategory>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(OrderContainerItem)
        private readonly orderContainerItemRepo: Repository<OrderContainerItem>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        @InjectRepository(MenuItemContainerItem)
        private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

        private readonly menuItemTestUtil: MenuItemTestingUtil,

        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) {
        this.orderTypeInit = false;
        this.orderInit = false;
        this.orderMenuItemInit = false;
    }

    /**
     * OrderCategory now requires a tenantId (NOT NULL). Most order-module
     * fixtures don't care about tenant scoping themselves — they only need a
     * valid tenantId to satisfy the column — so this lazily provisions (or
     * reuses, by fixed subdomain, across the whole test run) one shared
     * fixture Tenant rather than requiring every seed method's callers to
     * plumb a tenantId through. Tests that actually exercise tenant scoping
     * (order-category.*.spec.ts) seed and pass their own explicit tenantId.
     */
    private static readonly DEFAULT_TENANT_SUBDOMAIN = 'order-testing-util-fixture-tenant';
    private defaultTenantId?: number;
    public async getDefaultTenantId(): Promise<number> {
        if (this.defaultTenantId === undefined) {
            const existing = await this.tenantRepo.findOne({
                where: { subdomain: OrderTestingUtil.DEFAULT_TENANT_SUBDOMAIN },
            });
            const tenant =
                existing ??
                (await this.tenantRepo.save({
                    name: 'Order Testing Util Fixture Tenant',
                    subdomain: OrderTestingUtil.DEFAULT_TENANT_SUBDOMAIN,
                }));
            this.defaultTenantId = tenant.id;
        }
        return this.defaultTenantId;
    }

    // Order Category
    public async getTestOrderTypeEntities(
        testContext: DatabaseTestContext,
    ): Promise<OrderCategory[]> {
        const names = getTestOrderCategoryNames();
        const results: OrderCategory[] = [];
        const tenantId = await this.getDefaultTenantId();

        for (const name of names) {
            results.push({
                name: name,
                tenantId,
            } as OrderCategory);
        }

        return results;
    }

    public async initOrderCategoryTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.orderTypeInit) {
            return;
        }
        this.orderTypeInit = true;

        testContext.addCleanupFunction(() => this.cleanupOrderCategoryTestDatabase());
        const categories = await this.getTestOrderTypeEntities(testContext);
        for (const category of categories) {
            if (await this.categoryRepo.findOne({ where: { name: category.name } })) {
                continue;
            }
            await this.categoryRepo.save(category);
        }
    }

    public async cleanupOrderCategoryTestDatabase(): Promise<void> {
        await this.categoryRepo.deleteAll();
    }

    // Order Menu Item
    public async getTestOrderMenuItemEntities(
        testContext: DatabaseTestContext,
    ): Promise<OrderMenuItem[]> {
        await this.initOrderTestDatabase(testContext);
        await this.menuItemTestUtil.initMenuItemContainerItemTestDatabase(
            testContext,
        );

        const orders = await this.orderRepo.find();
        if (!orders) {
            throw new Error();
        }

        const menuItems = await this.menuItemRepo.find({
            relations: ['sizes'],
            where: { type: MENU_ITEM_TYPES.SINGLE },
        });
        if (!menuItems) {
            throw new Error();
        }

        let menuItemIdx = 0;
        let quantity = 1;
        let sizeIdx = 0;
        let orderItemMax = 4;
        const results: OrderMenuItem[] = [];

        for (const order of orders) {
            for (let i = 0; i < orderItemMax; i++) {
                const menuItem = menuItems[menuItemIdx++ % menuItems.length];
                if (!menuItem.sizes) {
                    throw new Error();
                }

                const size = menuItem.sizes[sizeIdx++ % menuItem.sizes?.length];

                results.push({
                    parentOrder: order,
                    menuItem,
                    quantity: quantity++,
                    size,
                } as OrderMenuItem);
            }
        }

        //Order Menu Item Container Items
        const containerMenuItems = await this.menuItemRepo.find({
            relations: [
                'sizes',
            ],
            where: { type: MENU_ITEM_TYPES.CONTAINER },
        });

        let containerItemIdx = 0;

        for (const order of orders) {
            const containerMenuItem = containerMenuItems[containerItemIdx++ % containerMenuItems.length];

            const validContainerMenuItems = await this.menuItemContainerItemRepo.find({
                where: { parentMenuItem: { id: containerMenuItem.id }, parentItemSize: { id: containerMenuItem.sizes[0].id } },
                relations: ['containedMenuItem', 'containedItemSize', 'parentMenuItem', 'parentItemSize']
            });

            if (containerMenuItem.variableMaxAmount) {
                const containerOrderItem = ({
                    parentOrder: order,
                    menuItem: containerMenuItem,
                    quantity: 1,
                    size: containerMenuItem.sizes[0],
                    containerOrderMenuItems: [] as any,
                });
                for (const validItem of validContainerMenuItems) { // factor in container size with valid container menu items
                    if (validItem.parentItemSize.id === containerMenuItem.sizes[0].id) {
                        containerOrderItem.containerOrderMenuItems.push({
                            parentOrderMenuItem: containerOrderItem,
                            containedMenuItem: validItem.containedMenuItem,
                            containedItemSize: validItem.containedItemSize,
                            quantity: containerMenuItem.variableMaxAmount,
                        });
                    }

                }
                results.push(containerOrderItem as OrderMenuItem);
            }
            else {
                const containerOrderItem = ({
                    parentOrder: order,
                    menuItem: containerMenuItem,
                    quantity: 1,
                    size: containerMenuItem.sizes[0],
                    containerOrderMenuItems: [] as any,
                });
                for (const validItem of validContainerMenuItems) { // factor in container size with valid container menu items
                    if (validItem.parentItemSize.id === containerMenuItem.sizes[0].id) {
                        containerOrderItem.containerOrderMenuItems.push({
                            parentOrderMenuItem: containerOrderItem,
                            containedMenuItem: validItem.containedMenuItem,
                            containedItemSize: validItem.containedItemSize,
                            quantity: validItem.quantity,
                        });
                    }
                }
                results.push(containerOrderItem as OrderMenuItem);
            }
        }

        return results;
    }

    public async initOrderMenuItemTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.orderMenuItemInit) {
            return;
        }
        this.orderMenuItemInit = true;

        testContext.addCleanupFunction(() =>
            this.cleanupOrderMenuItemTestDatabase(),
        );
        await this.orderMenuItemRepo.save(
            await this.getTestOrderMenuItemEntities(testContext),
        );
    }

    public async cleanupOrderMenuItemTestDatabase(): Promise<void> {
        await this.orderMenuItemRepo.deleteAll();
    }

    // Order
    public async getTestOrderEntities(
        testContext: DatabaseTestContext,
    ): Promise<Order[]> {
        await this.initOrderCategoryTestDatabase(testContext);

        const recipients: string[] = [
            'recipient_a',
            'recipient_b',
            'recipient_c',
            'recipient_d',
            'recipient_e',
            'recipient_f',
            'recipient_g',
        ];

        const fulfilltype: string[] = ['pickup', 'delivery'];
        let fIdx = 0;

        const orderTypes = await this.categoryRepo.find();
        if (!orderTypes) {
            throw new Error();
        }
        let otIndex = 0;

        const results: Order[] = [];
        let idx = 0;

        const fulfillmentDate = new Date();
        fulfillmentDate.setDate(fulfillmentDate.getDate() + idx);

        for (const name of recipients) {
            results.push({
                category: orderTypes[otIndex++ % orderTypes.length],
                recipient: name,
                fulfillmentDate,
                fulfillmentType: fulfilltype[fIdx++ % fulfilltype.length],
                deliveryAddress: 'delAddress' + idx,
                phoneNumber: 'number' + idx,
                email: 'email' + idx,
                note: 'note' + idx,
                isFrozen: false,
            } as Order);
            idx++;
        }

        // Recurring Order Schedule
        const dtstartDate = buildRRULEDateString(new Date());

        results.push({
            category: orderTypes[otIndex++ % orderTypes.length],
            recipient: 'recipient_a',
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            isFrozen: false,
            recurrenceSchedule: {
                rrule: `${dtstartDate}\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU;TZID=America/New_York;`,
                startDate: new Date(),
                timezone: 'America/New_York',
            } as RecurringOrderSchedule,
        } as Order)
        return results;
    }

    public async initOrderTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.orderInit) {
            return;
        }
        this.orderInit = true;

        testContext.addCleanupFunction(() => this.cleanupOrderTestDatabase());
        await this.orderRepo.save(await this.getTestOrderEntities(testContext));
    }

    public async cleanupOrderTestDatabase(): Promise<void> {
        await this.orderRepo.deleteAll();
    }

    // Dtos
    public async createNestedOrderMenuItemDtos(
        amount: number,
    ): Promise<NestedCreateOrderMenuItemDto[]> {
        const items = await this.menuItemRepo.find({
            relations: ['sizes'],
        });
        if (!items) {
            throw new Error();
        }

        const results: NestedCreateOrderMenuItemDto[] = [];
        for (let i = 0; i < amount; i++) {
            let createId = 1;
            const item = items[i % items.length];
            if (!item.sizes) {
                throw new Error();
            }
            if (item.sizes.length === 0) {
                throw new Error();
            }

            results.push(
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: `c${createId++}`,
                    menuItemId: item.id,
                    quantity: 1,
                    sizeId: item.sizes[0].id,
                }),
            );
        }

        return results;
    }

    // ─── Atomic-prefix seed methods ──────────────────────────────────────────────
    // These do NOT register cleanup — callers are responsible for deleting by ID.

    /**
     * 4 categories: type a-d. `tenantId` defaults to a shared fixture tenant
     * (see `getDefaultTenantId`) — pass one explicitly when the test actually
     * exercises tenant scoping.
     */
    public async seedCategories(P = '', tenantId?: number): Promise<{ categories: OrderCategory[] }> {
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());
        const names = getTestOrderCategoryNames();
        const categories: OrderCategory[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            categories.push(
                await this.categoryRepo.save({
                    name: entityName,
                    tenantId: effectiveTenantId,
                } as OrderCategory),
            );
        }
        return { categories };
    }

    /**
     * Delegates to MenuItemTestingUtil.seedContainerLines(P) for the menu item dependency chain.
     */
    public async seedMenuItems(P = ''): Promise<{
        menuItemCategories: MenuItemCategory[];
        menuItemSizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
        containerLines: MenuItemContainerItem[];
    }> {
        const { categories, sizes, singleItems, fixedContainerItems, varContainerItems, containerLines } =
            await this.menuItemTestUtil.seedContainerLines(P);
        return {
            menuItemCategories: categories,
            menuItemSizes: sizes,
            singleItems,
            fixedContainerItems,
            varContainerItems,
            containerLines,
        };
    }

    /**
     * 7 orders (recipient-a .. recipient-g), rotating through categories and fulfillment types.
     */
    public async seedOrders(P = ''): Promise<{
        categories: OrderCategory[];
        orders: Order[];
    }> {
        const { categories } = await this.seedCategories(P);

        const recipients = [
            'recipient-a',
            'recipient-b',
            'recipient-c',
            'recipient-d',
            'recipient-e',
            'recipient-f',
            'recipient-g',
        ];
        const fulfillTypes = ['pickup', 'delivery'];

        const orders: Order[] = [];
        let catIdx = 0;
        let fIdx = 0;
        let idx = 0;
        for (const name of recipients) {
            const fulfillmentDate = new Date();
            fulfillmentDate.setDate(fulfillmentDate.getDate() + idx);
            const entityName = P ? `${P}-${name}` : name;

            orders.push(
                await this.orderRepo.save({
                    category: categories[catIdx++ % categories.length],
                    recipient: entityName,
                    fulfillmentDate,
                    fulfillmentType: fulfillTypes[fIdx++ % fulfillTypes.length],
                    deliveryAddress: `${entityName}-delAddress`,
                    phoneNumber: `${entityName}-number`,
                    email: `${entityName}-email@example.com`,
                    note: `${entityName}-note`,
                    isFrozen: false,
                } as Order),
            );
            idx++;
        }

        return { categories, orders };
    }

    /**
     * Seeds orders and menu items, then adds order lines:
     * - 2 single-item lines per order (rotating through singleItems).
     * - 1 fixed-container line and 1 variable-max-container line, each on a separate order,
     *   with their child OrderContainerItem rows derived from containerLines.
     *
     * `orderMenuItems` is the flat list of every OrderMenuItem line created (reloaded with relations).
     * `containerOrderMenuItems` is the subset of `orderMenuItems` whose menuItem is a container.
     */
    public async seedOrderMenuItems(P = ''): Promise<{
        categories: OrderCategory[];
        orders: Order[];
        menuItemCategories: MenuItemCategory[];
        menuItemSizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
        containerLines: MenuItemContainerItem[];
        orderMenuItems: OrderMenuItem[];
        containerOrderMenuItems: OrderMenuItem[];
    }> {
        const { categories, orders } = await this.seedOrders(P);
        const { menuItemCategories, menuItemSizes, singleItems, fixedContainerItems, varContainerItems, containerLines } =
            await this.seedMenuItems(P);

        const orderMenuItemRelations = [
            'menuItem',
            'size',
            'parentOrder',
            'containerOrderMenuItems',
            'containerOrderMenuItems.containedMenuItem',
            'containerOrderMenuItems.containedItemSize',
        ];

        const orderMenuItems: OrderMenuItem[] = [];

        // 2 single-item lines per order.
        let miIdx = 0;
        let sizeIdx = 0;
        let qty = 1;
        for (const order of orders) {
            for (let i = 0; i < 2; i++) {
                const menuItem = singleItems[miIdx++ % singleItems.length];
                const size = menuItem.sizes[sizeIdx++ % menuItem.sizes.length];
                const saved = await this.orderMenuItemRepo.save({
                    parentOrder: order,
                    menuItem,
                    quantity: qty++,
                    size,
                } as OrderMenuItem);
                orderMenuItems.push(
                    await this.orderMenuItemRepo.findOneOrFail({
                        where: { id: saved.id },
                        relations: orderMenuItemRelations,
                    }),
                );
            }
        }

        // 1 fixed-container line + 1 variable-max-container line, each on their own order.
        const containerOrderMenuItems: OrderMenuItem[] = [];
        const containers = [fixedContainerItems[0], varContainerItems[0]];
        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const order = orders[i % orders.length];
            const size = container.sizes[0];

            const savedLine = await this.orderMenuItemRepo.save({
                parentOrder: order,
                menuItem: container,
                quantity: 1,
                size,
            } as OrderMenuItem);

            const relevantLines = containerLines.filter(
                (l) => l.parentMenuItem.id === container.id && l.parentItemSize.id === size.id,
            );
            for (const line of relevantLines) {
                await this.orderContainerItemRepo.save({
                    parentOrderMenuItem: savedLine,
                    containedMenuItem: line.containedMenuItem,
                    containedItemSize: line.containedItemSize,
                    quantity: line.quantity,
                } as OrderContainerItem);
            }

            const reloaded = await this.orderMenuItemRepo.findOneOrFail({
                where: { id: savedLine.id },
                relations: orderMenuItemRelations,
            });
            orderMenuItems.push(reloaded);
            containerOrderMenuItems.push(reloaded);
        }

        return {
            categories,
            orders,
            menuItemCategories,
            menuItemSizes,
            singleItems,
            fixedContainerItems,
            varContainerItems,
            containerLines,
            orderMenuItems,
            containerOrderMenuItems,
        };
    }

    /**
     * Seeds everything from seedOrderMenuItems, then adds one additional order with a
     * nested weekly RecurringOrderSchedule.
     */
    public async seedRecurringOrder(P = ''): Promise<{
        categories: OrderCategory[];
        orders: Order[];
        menuItemCategories: MenuItemCategory[];
        menuItemSizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
        containerLines: MenuItemContainerItem[];
        orderMenuItems: OrderMenuItem[];
        containerOrderMenuItems: OrderMenuItem[];
        recurringOrder: Order;
        recurringOrderSchedule: RecurringOrderSchedule;
    }> {
        const seeded = await this.seedOrderMenuItems(P);
        const entityName = P ? `${P}-recurring-recipient` : 'recurring-recipient';

        const dtstartDate = buildRRULEDateString(new Date());
        const saved = await this.orderRepo.save({
            category: seeded.categories[0],
            recipient: entityName,
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            isFrozen: false,
            recurrenceSchedule: {
                rrule: `${dtstartDate}\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU;TZID=America/New_York;`,
                startDate: new Date(),
                timezone: 'America/New_York',
            } as RecurringOrderSchedule,
        } as Order);

        const recurringOrder = await this.orderRepo.findOneOrFail({
            where: { id: saved.id },
            relations: ['recurrenceSchedule', 'category'],
        });
        if (!recurringOrder.recurrenceSchedule) {
            throw new Error('recurrence schedule not created');
        }

        return {
            ...seeded,
            recurringOrder,
            recurringOrderSchedule: recurringOrder.recurrenceSchedule,
        };
    }
}
