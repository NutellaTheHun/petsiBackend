import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemController } from './order-menu-item.controller';

describe('order menu item controller', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: OrderMenuItemController;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let orderRepo: Repository<Order>;

    beforeAll(async () => {
        module = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        controller = module.get<OrderMenuItemController>(OrderMenuItemController);
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderRepo = module.get(getRepositoryToken(Order));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await orderMenuItemRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy quantity DESC matches repository ordering', async () => {
        const repoResult = await orderMenuItemRepo.find({
            order: { quantity: 'DESC' },
        });
        if (!repoResult.length) throw new Error('order menu items not found');
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'quantity',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(result.items[0]?.quantity).toEqual(repoResult[0]?.quantity);
        expect(
            result.items[result.items.length - 1]?.quantity,
        ).toEqual(repoResult[repoResult.length - 1]?.quantity);
    });

    it('findAll with sortBy menuItem DESC matches repository ordering', async () => {
        const repoResult = await orderMenuItemRepo.find({
            relations: ['menuItem'],
            order: { menuItem: { name: 'DESC' } },
        });
        if (!repoResult.length) throw new Error('order menu items not found');
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'menuItem',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(result.items[0]?.menuItem?.name).toEqual(
            repoResult[0]?.menuItem?.name,
        );
        expect(
            result.items[result.items.length - 1]?.menuItem?.name,
        ).toEqual(repoResult[repoResult.length - 1]?.menuItem?.name);
    });

    it('findAll with filter by parentOrder matches line count', async () => {
        const order = await orderRepo.findOneOrFail({
            where: { orderedItems: MoreThan(0) },
            relations: ['orderedItems'],
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`parentOrder=${order.id}`],
        );
        expect(result.items.length).toEqual(order.orderedItems!.length);
    });

    it('findOne returns a seeded order menu item', async () => {
        const row = await orderMenuItemRepo.findOne({ where: {} });
        if (!row) throw new Error('no seeded order menu item');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a line then findOne fails', async () => {
        const row = await orderMenuItemRepo.findOne({ where: {} });
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
