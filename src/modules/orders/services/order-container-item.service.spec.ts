import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
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

describe('order container item service', () => {
    let service: TestableOrderContainerItemService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let orderContainerItemRepo: Repository<OrderContainerItem>;
    let menuItemRepo: Repository<MenuItem>;
    let orderItemRepo: Repository<OrderMenuItem>;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule({
            orderContainerItemServiceClass: TestableOrderContainerItemService,
        });
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);
        dataSource = module.get(DataSource);

        service = module.get(OrderContainerItemService) as TestableOrderContainerItemService;
        orderContainerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // test createEntity()
    it('should create container item', async () => {
        const existing = await orderContainerItemRepo.find({
            take: 1,
            relations: ['parentOrderMenuItem', 'containedMenuItem', 'containedItemSize'],
        });
        if (!existing.length) throw new Error('order container item not found');
        const e = existing[0];

        const dto = plainToInstance(CreateOrderContainerItemDto, {
            parentOrderMenuItemId: e.parentOrderMenuItem.id,
            containedMenuItemId: e.containedMenuItem.id,
            containedItemSizeId: e.containedItemSize.id,
            quantity: 99,
        });

        await dataSource.transaction(async (manager) => {
            const result = await service.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.quantity).toEqual(dto.quantity);
        });
    });

    // test updateEntity()
    it('should update container item', async () => {
        const toUpdate = await orderContainerItemRepo.findOneOrFail({
            where: {},
            relations: ['parentOrderMenuItem', 'containedMenuItem', 'containedItemSize'],
        });

        const dto = orderContainerItemToUpdateDto(toUpdate, { quantity: 5 });

        await dataSource.transaction(async (manager) => {
            await service.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await orderContainerItemRepo.findOne({
            where: { id: toUpdate.id },
        });
        if (!result) throw new Error('result not found');
        expect(result.quantity).toEqual(dto.quantity);
    });

    // test findAll()
    it('should find all container items', async () => {
        const repoResult = await orderContainerItemRepo.find();
        const serviceResult = await service.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with sort by containedMenuItem name
    it('should find all container items with sort by containedMenuItem name', async () => {
        const serviceResult = await service.findAll({
            sortBy: 'containedMenuItem',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
    });

    // test findOne()
    it('should find one container item', async () => {
        const c = await orderContainerItemRepo.find({ take: 1 });
        if (!c.length) throw new Error('container item not found');

        const serviceResult = await service.findOne(c[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(c[0].id);
    });

    // test findOne() with relations
    it('should find one container item with relations', async () => {
        const c = await orderContainerItemRepo.find({ take: 1 });
        if (!c.length) throw new Error('container item not found');

        const serviceResult = await service.findOne(c[0].id, [
            'parentOrderMenuItem',
            'containedMenuItem',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(c[0].id);
        expect(serviceResult?.parentOrderMenuItem).toBeDefined();
        expect(serviceResult?.containedMenuItem).toBeDefined();
    });

    // test remove()
    it('should remove container item', async () => {
        const c = await orderContainerItemRepo.find({ take: 1 });
        if (!c.length) throw new Error('container item not found');
        const id = c[0].id;

        const deleteResult = await service.remove(id);
        expect(deleteResult).toBe(true);
        await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });

    // test findAll() with filter by parentOrderMenuItem
    it('should find all container items with filter by parentOrderMenuItem', async () => {
        const orderItem = await orderItemRepo.findOneOrFail({ where: { containerOrderMenuItems: MoreThan(0) }, relations: ['containerOrderMenuItems'] });
        if (!orderItem.containerOrderMenuItems) throw new Error('container order menu items not found');

        const serviceResult = await service.findAll({
            filters: [`parentOrderMenuItem=${orderItem.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(orderItem.containerOrderMenuItems.length);
    });
});
