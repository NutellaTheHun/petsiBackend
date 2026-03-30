import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { VENDOR_A } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorService } from './inventory-item-vendor.service';

class TestableInventoryItemVendorService extends InventoryItemVendorService {
    async createEntityForTest(
        dto: CreateInventoryItemVendorDto,
        manager: EntityManager,
    ): Promise<InventoryItemVendor> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryItemVendorDto,
        entity: InventoryItemVendor,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

describe('Inventory Item Vendor Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let vendorService: TestableInventoryItemVendorService;
    let dataSource: DataSource;
    let vendorRepo: Repository<InventoryItemVendor>;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemVendorServiceClass: TestableInventoryItemVendorService,
        });

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);

        vendorService = module.get(
            InventoryItemVendorService,
        ) as TestableInventoryItemVendorService;
        dataSource = module.get(DataSource);
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(vendorService).toBeDefined();
    });

    // test createEntity()
    it('should create vendor', async () => {
        const dto = plainToInstance(CreateInventoryItemVendorDto, { name: 'Vendor D' });

        await dataSource.transaction(async (manager) => {
            const result = await vendorService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.name).toEqual(dto.name);
        });
    });

    // test updateEntity()
    it('should update vendor', async () => {
        const vendor = await vendorRepo.findOne({ where: { name: VENDOR_A } });
        if (!vendor) throw new Error('vendor not found');

        const dto = plainToInstance(UpdateInventoryItemVendorDto, { name: 'Vendor A Updated' });

        await dataSource.transaction(async (manager) => {
            await vendorService.updateEntityForTest(dto, vendor, manager);
        });

        const result = await vendorRepo.findOne({ where: { id: vendor.id } });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(dto.name);
    });

    // test findAll()
    it('should find all vendors', async () => {
        const repoResult = await vendorRepo.find();
        const serviceResult = await vendorService.findAll();
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with sort by name
    it('should find all vendors with sort by name', async () => {
        const repoResult = await vendorRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await vendorService.findAll({
            sortBy: 'name',
            sortOrder: 'DESC',
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
            const lastIdx = repoResult.length - 1;
            expect(serviceResult?.items[lastIdx].name).toEqual(
                repoResult[lastIdx].name,
            );
        }
    });

    // test findOne()
    it('should find one vendor', async () => {
        const vendor = await vendorRepo.find({ take: 1 });
        if (!vendor.length) throw new Error('vendor not found');

        const serviceResult = await vendorService.findOne(vendor[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(vendor[0].id);
    });

    // test findOne() with relations
    it('should find one vendor with relations', async () => {
        const vendor = await vendorRepo.find({
            take: 1,
            relations: ['inventoryItems'],
        });
        if (!vendor.length) throw new Error('vendor not found');

        const serviceResult = await vendorService.findOne(vendor[0].id, [
            'inventoryItems',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(vendor[0].id);
        expect(serviceResult?.inventoryItems).toBeDefined();
        expect(Array.isArray(serviceResult?.inventoryItems)).toBe(true);
    });

    // test remove()
    it('should remove vendor', async () => {
        const vendor = await vendorRepo.find({ take: 1 });
        if (!vendor.length) throw new Error('vendor not found');
        const id = vendor[0].id;

        const deleteResult = await vendorService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(vendorService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
