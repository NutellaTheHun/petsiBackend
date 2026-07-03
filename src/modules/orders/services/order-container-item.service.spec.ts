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
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { orderContainerItemToUpdateDto } from '../utils/entity-transformers/order-container-item.dto.transformer';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemService } from './order-container-item.service';

class TestableOrderContainerItemService extends OrderContainerItemService {
    async createEntityForTest(
        dto: CreateOrderContainerItemDto,
        manager: EntityManager,
    ): Promise<OrderContainerItem> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateOrderContainerItemDto,
        entity: OrderContainerItem,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('order container item service', () => {
    let service: TestableOrderContainerItemService;
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let orderContainerItemRepo: Repository<OrderContainerItem>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
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
            orderContainerItemServiceClass: TestableOrderContainerItemService,
        });
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dataSource = module.get(DataSource);

        service = module.get(OrderContainerItemService) as TestableOrderContainerItemService;
        orderContainerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
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
    it('should create container item', async () => {
        const parent = containerOrderMenuItems[0];
        const existingLine = parent.containerOrderMenuItems![0];

        const dto = plainToInstance(CreateOrderContainerItemDto, {
            parentOrderMenuItemId: parent.id,
            containedMenuItemId: existingLine.containedMenuItem.id,
            containedItemSizeId: existingLine.containedItemSize.id,
            quantity: 99,
        });

        await dataSource.transaction(async (manager) => {
            const result = await service.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.quantity).toEqual(dto.quantity);
            testCtx.addCleanupFunction(async () => {
                await orderContainerItemRepo.delete(result.id);
            });
        });
    });

    // test updateEntity()
    it('should update container item', async () => {
        const toUpdate = containerOrderMenuItems[0].containerOrderMenuItems![0];

        const dto = orderContainerItemToUpdateDto(toUpdate, { quantity: 5 });

        await dataSource.transaction(async (manager) => {
            await service.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await orderContainerItemRepo.findOneOrFail({
            where: { id: toUpdate.id },
        });
        expect(result.quantity).toEqual(dto.quantity);
    });

    // test findAll()
    it('should find seeded container item in findAll results', async () => {
        const target = containerOrderMenuItems[0].containerOrderMenuItems![0];
        const serviceResult = await service.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((i) => i.id === target.id);
        expect(found).toBeDefined();
    });

    // test findOne()
    it('should find one container item with relations', async () => {
        const target = containerOrderMenuItems[0].containerOrderMenuItems![0];
        const serviceResult = await service.findOne(target.id, [
            'parentOrderMenuItem',
            'containedMenuItem',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(target.id);
        expect(serviceResult?.parentOrderMenuItem).toBeDefined();
        expect(serviceResult?.containedMenuItem).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    // test findAll() with filter by parentOrderMenuItem
    it('should find all container items with filter by parentOrderMenuItem', async () => {
        const parent = containerOrderMenuItems[1];

        const serviceResult = await service.findAll({
            filters: [`parentOrderMenuItem=${parent.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(parent.containerOrderMenuItems!.length);
    });

    describe('container item lifecycle', () => {
        let item: OrderContainerItem;

        it('should create', async () => {
            const parent = containerOrderMenuItems[1];
            const existingLine = parent.containerOrderMenuItems![0];
            const dto = plainToInstance(CreateOrderContainerItemDto, {
                parentOrderMenuItemId: parent.id,
                containedMenuItemId: existingLine.containedMenuItem.id,
                containedItemSizeId: existingLine.containedItemSize.id,
                quantity: 7,
            });
            await dataSource.transaction(async (manager) => {
                item = await service.createEntityForTest(dto, manager);
            });
            expect(item.id).toBeDefined();
        });

        it('should remove', async () => {
            const deleteResult = await service.remove(item.id);
            expect(deleteResult).toBe(true);
            await expect(service.findOne(item.id)).rejects.toThrow(NotFoundException);
        });
    });
});
