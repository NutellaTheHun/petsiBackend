import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeController } from './inventory-item-size.controller';

describe('Inventory Item Size Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryItemSizeController;
    let sizeRepo: Repository<InventoryItemSize>;

    beforeAll(async () => {
        module = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

        controller = module.get<InventoryItemSizeController>(
            InventoryItemSizeController,
        );
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns sizes aligned with repository', async () => {
        const repoRows = await sizeRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sort by cost DESC', async () => {
        const repoResult = await sizeRepo.find({ order: { cost: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'cost',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(Number(result.items[0].cost)).toEqual(
                Number(repoResult[0].cost),
            );
        }
    });

    it('findOne returns seeded size', async () => {
        const row = await sizeRepo.findOne({ where: {} });
        if (!row) throw new Error('no size');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a size then findOne fails', async () => {
        const row = await sizeRepo.findOne({ where: {} });
        if (!row) throw new Error('no size');
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
