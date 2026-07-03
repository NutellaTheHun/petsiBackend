import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { orderMenuItemToUpdateDto } from '../utils/entity-transformers/order-menu-item.dto.transformer';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemService } from './order-menu-item.service';

class TestableOrderMenuItemService extends OrderMenuItemService {
    async createEntityForTest(
        dto: CreateOrderMenuItemDto,
        manager: EntityManager,
    ): Promise<OrderMenuItem> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateOrderMenuItemDto,
        entity: OrderMenuItem,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('order menu item service', () => {
    let orderItemService: TestableOrderMenuItemService;
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let containerItemRepo: Repository<OrderContainerItem>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemCategoryRepo: Repository<MenuItemCategory>;
    let menuItemSizeRepo: Repository<MenuItemSize>;

    let categories: OrderCategory[];
    let orders: Order[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let containerLines: MenuItemContainerItem[];
    let orderMenuItems: OrderMenuItem[];
    let containerOrderMenuItems: OrderMenuItem[];
    let menuItemCategories: MenuItemCategory[];
    let menuItemSizes: MenuItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule({
            orderMenuItemServiceClass: TestableOrderMenuItemService,
        });
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dataSource = module.get(DataSource);

        orderItemService = module.get(
            OrderMenuItemService,
        ) as TestableOrderMenuItemService;
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        containerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ categories, orders, singleItems, fixedContainerItems, varContainerItems, containerLines, orderMenuItems, containerOrderMenuItems, menuItemCategories, menuItemSizes } =
            await testingUtil.seedOrderMenuItems(P));
    });

    afterAll(async () => {
        await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
        await orderRepo.delete(orders.map((o) => o.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await menuItemContainerItemRepo.delete(containerLines.map((l) => l.id));
        await menuItemRepo.delete([...singleItems, ...fixedContainerItems, ...varContainerItems].map((i) => i.id));
        await menuItemSizeRepo.delete(menuItemSizes.map((s) => s.id));
        await menuItemCategoryRepo.delete(menuItemCategories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // test createEntity()
    it('should create order menu item', async () => {
        const order = orders[0];
        const menuItem = singleItems[0];

        const dto = plainToInstance(CreateOrderMenuItemDto, {
            parentOrderId: order.id,
            menuItemId: menuItem.id,
            sizeId: menuItem.sizes[0].id,
            quantity: 2,
        });

        await dataSource.transaction(async (manager) => {
            const result = await orderItemService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.quantity).toEqual(dto.quantity);
            testCtx.addCleanupFunction(async () => {
                await orderMenuItemRepo.delete(result.id);
            });
        });
    });

    // test createEntity() with NestedCreateOrderContainerItemDtos
    it('should create order menu item with NestedCreateOrderContainerItemDtos', async () => {
        const order = orders[0];
        const container = fixedContainerItems[0];
        const line = containerLines.find((l) => l.parentMenuItem.id === container.id);
        if (!line) throw new Error('container line not found');

        const dto = plainToInstance(CreateOrderMenuItemDto, {
            parentOrderId: order.id,
            menuItemId: container.id,
            sizeId: line.parentItemSize.id,
            quantity: 1,
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: line.containedMenuItem.id,
                    containedItemSizeId: line.containedItemSize.id,
                    quantity: line.quantity,
                }),
            ],
        });

        await dataSource.transaction(async (manager) => {
            const result = await orderItemService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.containerOrderMenuItems).toBeDefined();
            expect(Array.isArray(result.containerOrderMenuItems)).toBe(true);
            expect(result.containerOrderMenuItems!.length).toBeGreaterThan(0);
            testCtx.addCleanupFunction(async () => {
                await orderMenuItemRepo.delete(result.id);
            });
        });
    });

    // test updateEntity()
    it('should update order menu item', async () => {
        const toUpdate = orderMenuItems[0];

        const dto = orderMenuItemToUpdateDto(toUpdate, { quantity: 10 });

        await dataSource.transaction(async (manager) => {
            await orderItemService.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await orderMenuItemRepo.findOneOrFail({
            where: { id: toUpdate.id },
        });
        expect(result.quantity).toEqual(dto.quantity);
    });

    // test updateEntity() with NestedUpdate and NestedCreate for container
    it('should update order menu item whos menuItem is of type container with NestedCreateOrderContainerItemDto', async () => {
        const toUpdate = containerOrderMenuItems[0];

        const newContainer = fixedContainerItems[1];
        const newLine = containerLines.find((l) => l.parentMenuItem.id === newContainer.id);
        if (!newLine) throw new Error('new container line not found');
        const newQuantity = 5;

        // orderMenuItemToUpdateDto preserves existing container lines as NestedUpdateDtos
        // and prepends the override, so this both keeps the original line and adds a new one.
        const dto = orderMenuItemToUpdateDto(toUpdate, {
            containerOrderMenuItems: [
                plainToInstance(NestedCreateOrderContainerItemDto, {
                    createId: 'newLine1',
                    containedMenuItemId: newLine.containedMenuItem.id,
                    containedItemSizeId: newLine.containedItemSize.id,
                    quantity: newQuantity,
                }),
            ],
        });

        await dataSource.transaction(async (manager) => {
            await orderItemService.updateEntityForTest(dto, toUpdate, manager);
        });

        const updatedItem = await orderMenuItemRepo.findOneOrFail({
            where: { id: toUpdate.id },
            relations: ['containerOrderMenuItems', 'containerOrderMenuItems.containedMenuItem', 'containerOrderMenuItems.containedItemSize'],
        });
        expect(
            updatedItem.containerOrderMenuItems?.find(
                (c) =>
                    c.containedMenuItem.id === newLine.containedMenuItem.id &&
                    c.containedItemSize.id === newLine.containedItemSize.id &&
                    c.quantity === newQuantity,
            ),
        ).toBeDefined();
    });

    // test findAll()
    it('should find seeded order menu item in findAll results', async () => {
        const serviceResult = await orderItemService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((i) => i.id === orderMenuItems[0].id);
        expect(found).toBeDefined();
    });

    // test findOne()
    it('should find one order menu item with relations', async () => {
        const oi = orderMenuItems[0];
        const serviceResult = await orderItemService.findOne(oi.id, [
            'parentOrder',
            'menuItem',
            'containerOrderMenuItems',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(oi.id);
        expect(serviceResult?.parentOrder).toBeDefined();
        expect(serviceResult?.menuItem).toBeDefined();
        expect(Array.isArray(serviceResult?.containerOrderMenuItems)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(orderItemService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    // test findAll() with filter by parentOrder
    it('should find all order menu items with filter by parentOrder', async () => {
        const order = await orderRepo.findOneOrFail({ where: { id: orders[0].id }, relations: ['orderedItems'] });

        const serviceResult = await orderItemService.findAll({
            filters: [`parentOrder=${order.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(order.orderedItems.length);
    });

    describe('order menu item lifecycle', () => {
        let item: OrderMenuItem;

        it('should create', async () => {
            const dto = plainToInstance(CreateOrderMenuItemDto, {
                parentOrderId: orders[1].id,
                menuItemId: singleItems[1].id,
                sizeId: singleItems[1].sizes[0].id,
                quantity: 1,
            });
            await dataSource.transaction(async (manager) => {
                item = await orderItemService.createEntityForTest(dto, manager);
            });
            expect(item.id).toBeDefined();
        });

        it('should remove', async () => {
            const deleteResult = await orderItemService.remove(item.id);
            expect(deleteResult).toBe(true);
            await expect(orderItemService.findOne(item.id)).rejects.toThrow(NotFoundException);
        });
    });
});
