import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { inventoryItemPackageToUpdateDto } from '../utils/entity-transformers/inventory-item-package.dto.transformer';
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

const P = `t${Date.now()}`;

describe('Inventory Item Package Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let packageService: TestableInventoryItemPackageService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let packageRepo: Repository<InventoryItemPackage>;

    let packages: InventoryItemPackage[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemPackageServiceClass: TestableInventoryItemPackageService,
        });
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        packageService = module.get(
            InventoryItemPackageService,
        ) as TestableInventoryItemPackageService;
        dataSource = module.get(DataSource);
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));

        ({ packages } = await testingUtil.seedPackages(P));
    });

    afterAll(async () => {
        await packageRepo.delete(packages.map((p) => p.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('package lifecycle', () => {
        let created: InventoryItemPackage;

        it('should create package', async () => {
            const dto = plainToInstance(CreateInventoryItemPackageDto, { name: `${P}-pkg-create` });
            await dataSource.transaction(async (manager) => {
                created = await packageService.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
        });

        it('should update package', async () => {
            const dto = plainToInstance(UpdateInventoryItemPackageDto, { name: `${P}-pkg-updated` });
            await dataSource.transaction(async (manager) => {
                await packageService.updateEntityForTest(dto, created, manager);
            });
            const reloaded = await packageRepo.findOneOrFail({ where: { id: created.id } });
            expect(reloaded.name).toBe(`${P}-pkg-updated`);
        });

        it('should remove package', async () => {
            await packageService.remove(created.id);
            await expect(packageService.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded package in findAll results', async () => {
        const result = await packageService.findAll();
        const found = result.items.find((p) => p.id === packages[0].id);
        expect(found).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(packageService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryItemPackageService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const pkg = packages[0];
            const dto = inventoryItemPackageToUpdateDto(pkg);
            await packageService.update(pkg.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const pkg = packages[1];
            const dto = inventoryItemPackageToUpdateDto(pkg, { name: `${P}-pkg-renamed` });
            await packageService.update(pkg.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await packageRepo.findOneOrFail({ where: { id: pkg.id } });
            expect(row.name).toBe(`${P}-pkg-renamed`);
        });
    });
});
