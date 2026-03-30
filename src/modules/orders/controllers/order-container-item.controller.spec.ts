import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderContainerItemController } from './order-container-item.controller';

describe('order container item controller', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: OrderContainerItemController;
    let orderContainerItemRepo: Repository<OrderContainerItem>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;

    beforeAll(async () => {
        module = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        controller = module.get<OrderContainerItemController>(
            OrderContainerItemController,
        );
        orderContainerItemRepo = module.get(
            getRepositoryToken(OrderContainerItem),
        );
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await orderContainerItemRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy containedMenuItem returns non-empty list', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'containedMenuItem',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findAll with filter by parentOrderMenuItem matches line count', async () => {
        const orderItem = await orderMenuItemRepo.findOneOrFail({
            where: { containerOrderMenuItems: MoreThan(0) },
            relations: ['containerOrderMenuItems'],
        });
        if (!orderItem.containerOrderMenuItems) {
            throw new Error('container order menu items not found');
        }
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`parentOrderMenuItem=${orderItem.id}`],
        );
        expect(result.items.length).toEqual(
            orderItem.containerOrderMenuItems.length,
        );
    });

    it('findOne returns a seeded container line', async () => {
        const row = await orderContainerItemRepo.findOne({ where: {} });
        if (!row) throw new Error('no seeded order container item');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a container line then findOne fails', async () => {
        const row = await orderContainerItemRepo.findOne({ where: {} });
        if (!row) throw new Error('no row to remove');
        const id = row.id;
        await controller.remove(id);
        await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
