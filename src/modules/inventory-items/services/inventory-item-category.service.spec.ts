import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { FOOD_CAT } from '../utils/constants';
import { NotFoundException } from '@nestjs/common';

describe('Inventory Item Category Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let service: InventoryItemCategoryService;
    let dbTestContext: DatabaseTestContext;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext()
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);

        service = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    });

    afterAll(async () => {
        const categoryQueryBuilder = service.getQueryBuilder();
        await categoryQueryBuilder.delete().execute();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a inventory item category', async () => {
        const dto = {
            itemCategoryName: "testCategoryName"
        } as CreateInventoryItemCategoryDto;

        const result = await service.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.categoryName).toEqual("testCategoryName")

        testId = result?.id as number;
    });

    it('should update a inventory item category', async () => {
        const dto = {
            itemCategoryName: "UPDATE_NAME"
        } as UpdateInventoryItemCategoryDto;
        const result = await service.update(testId, dto);

        expect(result?.categoryName).toEqual("UPDATE_NAME");
    });

    it('should remove a inventory item category', async () => {
        const removal = await service.remove(testId);
        expect(removal).toBeTruthy();

        await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it('should insert testing item categories and get all categories', async () => {
        const categories = await testingUtil.getTestInventoryItemCategoryEntities(dbTestContext);
        await testingUtil.initInventoryItemCategoryTestDatabase(dbTestContext);

        const results = await service.findAll();

        expect(results.items.length).toEqual(categories.length);

        testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
    });

    it('should get a inventory item category by name', async () => {
        const result = await service.findOneByName(FOOD_CAT);

        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual(FOOD_CAT);
    });

    it('should get inventory item categories from a list of ids', async () => {
        const results = await service.findEntitiesById(testIds);

        expect(results.length).toEqual(testIds.length);

        for (const result of results) {
            expect(testIds.find(id => result.id)).toBeTruthy();
        }
    });
});