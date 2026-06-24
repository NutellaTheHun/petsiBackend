import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Like, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { FOOD_A, FOOD_CAT } from '../utils/constants';
import { inventoryItemToUpdateDto } from '../utils/entity-transformers/inventory-item.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemService } from './inventory-item.service';

class TestableInventoryItemService extends InventoryItemService {
    async createEntityForTest(
        dto: CreateInventoryItemDto,
        manager: EntityManager,
    ): Promise<InventoryItem> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryItemDto,
        entity: InventoryItem,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}
describe('Inventory Item Service', () => {
    let module: TestingModule;
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    let itemService: TestableInventoryItemService;

    let itemRepo: Repository<InventoryItem>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let packageRepo: Repository<InventoryItemPackage>;
    let sizeRepo: Repository<InventoryItemSize>;
    let vendorRepo: Repository<InventoryItemVendor>;

    beforeAll(async () => {
        module = await getInventoryItemTestingModule({
            inventoryItemServiceClass: TestableInventoryItemService,
        });
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);
        itemService = module.get(
            InventoryItemService,
        ) as TestableInventoryItemService;
        dataSource = module.get(DataSource);

        itemRepo = module.get(getRepositoryToken(InventoryItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(itemService).toBeDefined();
    });

    // test createEntity() with nestedCreateInventoryItemSizeDto
    it('should create item with nestedCreateInventoryItemSizeDto', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        const vendor = await vendorRepo.findOne({ where: {} });
        const pkg = await packageRepo.findOne({ where: {} });
        if (!category || !vendor || !pkg) {
            throw new Error('category, vendor, or package not found');
        }

        const sizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'c1',
            packageId: pkg.id,
            unit: 'lb',
            measureAmount: 2,
            cost: 5.99,
        });

        const dto = plainToInstance(CreateInventoryItemDto, {
            name: 'New Item With Size',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [sizeDto],
        });

        await dataSource.transaction(async (manager) => {
            const result = await itemService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.name).toEqual(dto.name);
            expect(result.sizes?.length).toEqual(1);
            expect(Number(result.sizes?.[0]?.cost)).toEqual(5.99);
        });
    });

    // test updateEntity() with nestedUpdateInventoryItemSizeDto and nestedCreateInventoryItemSizeDto
    it('should update item with nestedUpdateInventoryItemSizeDto and nestedCreateInventoryItemSizeDto', async () => {
        const item = await itemRepo.findOne({
            where: { name: FOOD_A },
            relations: ['sizes', 'category', 'vendor', 'sizes.package'],
        });
        if (!item?.sizes?.length) throw new Error('item with sizes not found');

        const pkg = await packageRepo.findOne({ where: {} });
        if (!pkg) throw new Error('package not found');

        const createSizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'c2',
            packageId: pkg.id,
            unit: 'lb',
            measureAmount: 3,
            cost: 8.25,
        });

        const dto = inventoryItemToUpdateDto(item, { sizes: [createSizeDto] });

        const sizeToUpdate = dto.sizes.pop();
        if (!sizeToUpdate) throw new Error('size to update not found');
        if ('createId' in sizeToUpdate) throw new Error('nested dto is create');
        const updateSizeDto = plainToInstance(NestedUpdateInventoryItemSizeDto, {
            id: sizeToUpdate.id,
            cost: 15.5,
            packageId: sizeToUpdate.packageId,
            unit: sizeToUpdate.unit,
            measureAmount: sizeToUpdate.measureAmount,
        });

        dto.sizes.push(updateSizeDto);

        await dataSource.transaction(async (manager) => {
            await itemService.updateEntityForTest(dto, item, manager);
        });

        const result = await itemRepo.findOne({
            where: { id: item.id },
            relations: ['sizes'],
        });
        if (!result) throw new Error('result not found');
        const updatedSize = result.sizes?.find((s) => s.id === sizeToUpdate.id);
        expect(updatedSize).toBeDefined();
        expect(Number(updatedSize?.cost)).toEqual(15.5);
        const newSize = result.sizes?.find(
            (s) => s.measureAmount === 3 && Number(s.cost) === 8.25,
        );
        expect(newSize).toBeDefined();
    });

    // test findAll()
    it('should find all items', async () => {
        const repoResult = await itemRepo.find();
        const serviceResult = await itemService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with search by name
    it('should find all items with search by name', async () => {
        const repoResult = await itemRepo.find({
            where: { name: Like('%food%') },
        });
        const serviceResult = await itemService.findAll({
            search: 'food',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with filter by category
    it('should find all items with filter by category', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!category) throw new Error('category not found');

        const repoResult = await itemRepo.find({
            where: { category: { id: category.id } },
        });
        const serviceResult = await itemService.findAll({
            filters: [`category=${category.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with filter by vendor
    it('should find all items with filter by vendor', async () => {
        const vendor = await vendorRepo.findOne({ where: {} });
        if (!vendor) throw new Error('vendor not found');

        const repoResult = await itemRepo.find({
            where: { vendor: { id: vendor.id } },
        });
        const serviceResult = await itemService.findAll({
            filters: [`vendor=${vendor.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with filter by category and vendor
    it('should find all items with filter by category and vendor', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        const vendor = await vendorRepo.findOne({ where: {} });
        if (!category || !vendor) throw new Error('category or vendor not found');

        const repoResult = await itemRepo.find({
            where: {
                category: { id: category.id },
                vendor: { id: vendor.id },
            },
        });
        const serviceResult = await itemService.findAll({
            filters: [`category=${category.id}`, `vendor=${vendor.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findOne()
    it('should find one item', async () => {
        const item = await itemRepo.find({ take: 1 });
        if (!item.length) throw new Error('item not found');

        const serviceResult = await itemService.findOne(item[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(item[0].id);
    });

    // test findOne() with relations
    it('should find one item with relations', async () => {
        const item = await itemRepo.find({
            take: 1,
            relations: ['category', 'vendor', 'sizes'],
        });
        if (!item.length) throw new Error('item not found');

        const serviceResult = await itemService.findOne(item[0].id, [
            'category',
            'vendor',
            'sizes',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(item[0].id);
        expect(serviceResult?.category).toBeDefined();
        expect(serviceResult?.vendor).toBeDefined();
        expect(serviceResult?.sizes).toBeDefined();
        expect(Array.isArray(serviceResult?.sizes)).toBe(true);
    });

    // test remove()
    it('should remove item', async () => {
        const item = await itemRepo.find({ take: 1 });
        if (!item.length) throw new Error('item not found');
        const id = item[0].id;

        const deleteResult = await itemService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(itemService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
