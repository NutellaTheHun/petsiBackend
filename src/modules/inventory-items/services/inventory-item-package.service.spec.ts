import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { BOX_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageService } from './inventory-item-package.service';

class TestableInventoryItemPackageService extends InventoryItemPackageService {
    async createEntityForTest(
        dto: CreateInventoryItemPackageDto,
        manager: EntityManager,
    ): Promise<InventoryItemPackage> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryItemPackageDto,
        entity: InventoryItemPackage,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

describe('Inventory Item Package Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let packageService: TestableInventoryItemPackageService;
    let dataSource: DataSource;
    let packageRepo: Repository<InventoryItemPackage>;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemPackageServiceClass: TestableInventoryItemPackageService,
        });

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);

        packageService = module.get(
            InventoryItemPackageService,
        ) as TestableInventoryItemPackageService;
        dataSource = module.get(DataSource);
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(packageService).toBeDefined();
    });

    // test createEntity()
    it('should create package', async () => {
        const dto = plainToInstance(CreateInventoryItemPackageDto, { name: 'bottle' });

        await dataSource.transaction(async (manager) => {
            const result = await packageService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.name).toEqual(dto.name);
        });
    });

    // test updateEntity()
    it('should update package', async () => {
        const pkg = await packageRepo.findOne({ where: { name: BOX_PKG } });
        if (!pkg) throw new Error('package not found');

        const dto = plainToInstance(UpdateInventoryItemPackageDto, { name: 'Box Updated' });

        await dataSource.transaction(async (manager) => {
            await packageService.updateEntityForTest(dto, pkg, manager);
        });

        const result = await packageRepo.findOne({ where: { id: pkg.id } });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(dto.name);
    });

    // test findAll()
    it('should find all packages', async () => {
        const repoResult = await packageRepo.find();
        const serviceResult = await packageService.findAll();
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with sort by name
    it('should find all packages with sort by name', async () => {
        const repoResult = await packageRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await packageService.findAll({
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
    it('should find one package', async () => {
        const pkg = await packageRepo.find({ take: 1 });
        if (!pkg.length) throw new Error('package not found');

        const serviceResult = await packageService.findOne(pkg[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(pkg[0].id);
    });

    // test remove()
    it('should remove package', async () => {
        const pkg = await packageRepo.find({ take: 1 });
        if (!pkg.length) throw new Error('package not found');
        const id = pkg[0].id;

        const deleteResult = await packageService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(packageService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
