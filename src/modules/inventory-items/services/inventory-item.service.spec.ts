import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
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

const P = `t${Date.now()}`;

describe('Inventory Item Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let itemService: TestableInventoryItemService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let itemRepo: Repository<InventoryItem>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let packageRepo: Repository<InventoryItemPackage>;
    let sizeRepo: Repository<InventoryItemSize>;
    let vendorRepo: Repository<InventoryItemVendor>;

    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemServiceClass: TestableInventoryItemService,
        });
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        itemService = module.get(InventoryItemService) as TestableInventoryItemService;
        dataSource = module.get(DataSource);

        itemRepo = module.get(getRepositoryToken(InventoryItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));

        ({ categories, vendors, packages, items, sizes } = await testingUtil.seedSizes(P));
    });

    afterAll(async () => {
        await sizeRepo.delete(sizes.map((s) => s.id));
        await itemRepo.delete(items.map((i) => i.id));
        await packageRepo.delete(packages.map((p) => p.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await vendorRepo.delete(vendors.map((v) => v.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('item lifecycle', () => {
        let item: InventoryItem;

        it('should create item with nestedCreateInventoryItemSizeDto', async () => {
            const dto = plainToInstance(CreateInventoryItemDto, {
                name: `${P}-lifecycle-item`,
                categoryId: categories[3].id,
                vendorId: vendors[0].id,
                sizes: [
                    plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c1',
                        packageId: packages[0].id,
                        unit: 'lb',
                        measureAmount: 10,
                        cost: 5.99,
                    }),
                ],
            });
            await dataSource.transaction(async (manager) => {
                item = await itemService.createEntityForTest(dto, manager);
            });
            expect(item.id).toBeDefined();
            expect(item.name).toBe(dto.name);
            expect(item.sizes?.length).toBe(1);
            expect(Number(item.sizes?.[0]?.cost)).toBe(5.99);
        });

        it('should update item name', async () => {
            const loaded = await itemRepo.findOneOrFail({
                where: { id: item.id },
                relations: ['sizes', 'category', 'vendor', 'sizes.package'],
            });
            const dto = inventoryItemToUpdateDto(loaded, { name: `${P}-lifecycle-item-updated` });
            await dataSource.transaction(async (manager) => {
                await itemService.updateEntityForTest(dto, loaded, manager);
            });
            const reloaded = await itemRepo.findOneOrFail({ where: { id: item.id } });
            expect(reloaded.name).toBe(`${P}-lifecycle-item-updated`);
        });

        it('should remove item', async () => {
            await itemService.remove(item.id);
            await expect(itemService.findOne(item.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should update item with nestedUpdateInventoryItemSizeDto and nestedCreateInventoryItemSizeDto', async () => {
        const item = await itemRepo.findOneOrFail({
            where: { id: items[0].id },
            relations: ['sizes', 'category', 'vendor', 'sizes.package'],
        });
        if (!item.sizes?.length) throw new Error('item with sizes not found');

        const createSizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'c2',
            packageId: packages[3].id,
            unit: 'oz',
            measureAmount: 30,
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

        const result = await itemRepo.findOneOrFail({
            where: { id: item.id },
            relations: ['sizes'],
        });
        const updatedSize = result.sizes?.find((s) => s.id === sizeToUpdate.id);
        expect(updatedSize).toBeDefined();
        expect(Number(updatedSize?.cost)).toBe(15.5);
        const newSize = result.sizes?.find(
            (s) => s.measureAmount === 30 && Number(s.cost) === 8.25,
        );
        expect(newSize).toBeDefined();
    });

    it('should find seeded food item in findAll search results', async () => {
        // P-prefixed food item names contain 'foodA', 'foodB', 'foodC'
        const result = await itemService.findAll({ search: 'foodA', limit: 100 });
        const found = result.items.find((i) => i.id === items[0].id);
        expect(found).toBeDefined();
    });

    it('should find seeded items filtered by category', async () => {
        const foodCat = categories[3];
        const result = await itemService.findAll({
            filters: [`category=${foodCat.id}`],
            limit: 100,
        });
        const found = result.items.find((i) => i.id === items[0].id);
        expect(found).toBeDefined();
        expect(result.items.every((i) => i.category?.id === foodCat.id || !i.category)).toBe(true);
    });

    it('should find seeded items filtered by vendor', async () => {
        const vendor = vendors[0];
        const result = await itemService.findAll({
            filters: [`vendor=${vendor.id}`],
            limit: 100,
        });
        const found = result.items.find((i) => i.id === items[0].id);
        expect(found).toBeDefined();
    });

    it('should find seeded items filtered by category and vendor', async () => {
        const foodCat = categories[3];
        const vendor = vendors[0];
        const result = await itemService.findAll({
            filters: [`category=${foodCat.id}`, `vendor=${vendor.id}`],
            limit: 100,
        });
        const found = result.items.find((i) => i.id === items[0].id);
        expect(found).toBeDefined();
    });

    it('should find one item with relations', async () => {
        const result = await itemService.findOne(items[0].id, ['category', 'vendor', 'sizes']);
        expect(result.id).toBe(items[0].id);
        expect(result.category).toBeDefined();
        expect(result.vendor).toBeDefined();
        expect(Array.isArray(result.sizes)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(itemService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryItemService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const item = await itemRepo.findOneOrFail({
                where: { id: items[1].id },
                relations: ['sizes', 'category', 'vendor', 'sizes.package'],
            });
            if (!item.sizes?.length) throw new Error('item sizes missing');
            const dto = inventoryItemToUpdateDto(item);
            const result = await itemService.update(item.id, dto);
            expect(result.name).toBe(item.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const item = await itemRepo.findOneOrFail({
                where: { id: items[3].id },
                relations: ['sizes', 'category', 'vendor', 'sizes.package'],
            });
            if (!item.sizes?.length) throw new Error('item sizes missing');
            const dto = inventoryItemToUpdateDto(item, { name: `${P}-item-renamed` });
            await itemService.update(item.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await itemRepo.findOneOrFail({ where: { id: item.id } });
            expect(row.name).toBe(`${P}-item-renamed`);
        });
    });
});
