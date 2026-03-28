import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemController } from './inventory-area-item.controller';

describe('inventory area item controller', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryAreaItemController;
    let itemRepo: Repository<InventoryAreaItem>;

    beforeAll(async () => {
        module = await getInventoryAreasTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        controller = module.get<InventoryAreaItemController>(
            InventoryAreaItemController,
        );
        itemRepo = module.get(getRepositoryToken(InventoryAreaItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoCount = await itemRepo.count();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoCount);
    });

    it('findOne returns a seeded area item', async () => {
        const row = await itemRepo.findOne({
            where: {},
            relations: ['countedInventoryItem'],
        });
        if (!row) throw new Error('no seeded inventory area item');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes an item then findOne fails', async () => {
        const row = await itemRepo.findOne({ where: {} });
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
