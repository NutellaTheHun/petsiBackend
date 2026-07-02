import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaService } from './inventory-area.service';

class TestableInventoryAreaService extends InventoryAreaService {
    async createEntityForTest(
        dto: CreateInventoryAreaDto,
        manager: EntityManager,
    ) {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryAreaDto,
        entity: InventoryArea,
        manager: EntityManager,
    ) {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory area service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let service: TestableInventoryAreaService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let areaRepo: Repository<InventoryArea>;

    let areas: InventoryArea[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule({
            areaServiceClass: TestableInventoryAreaService,
        });
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        service = module.get(InventoryAreaService) as TestableInventoryAreaService;
        dataSource = module.get(DataSource);
        areaRepo = module.get(getRepositoryToken(InventoryArea));

        ({ areas } = await testingUtil.seedAreas(P));
    });

    afterAll(async () => {
        await areaRepo.delete(areas.map((a) => a.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('area lifecycle', () => {
        let area: InventoryArea;

        it('should create area', async () => {
            const dto = plainToInstance(CreateInventoryAreaDto, {
                name: `${P}-lifecycle-area`,
            });
            await dataSource.transaction(async (manager) => {
                area = await service.createEntityForTest(dto, manager);
            });
            expect(area.id).toBeDefined();
            expect(area.name).toBe(dto.name);
        });

        it('should update area', async () => {
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: `${P}-lifecycle-area-updated`,
            });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, area, manager);
            });
            const reloaded = await areaRepo.findOneOrFail({ where: { id: area.id } });
            expect(reloaded.name).toBe(`${P}-lifecycle-area-updated`);
        });

        it('should remove area', async () => {
            await service.remove(area.id);
            await expect(service.findOne(area.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded area in findAll results', async () => {
        const result = await service.findAll({ limit: 100 });
        const found = result.items.find((a) => a.id === areas[0].id);
        expect(found).toBeDefined();
    });

    it('should find one area with relations', async () => {
        const result = await service.findOne(areas[0].id, ['inventoryCounts']);
        expect(result.id).toBe(areas[0].id);
        expect(Array.isArray(result.inventoryCounts)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryAreaService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const area = await areaRepo.findOneOrFail({ where: { id: areas[1].id } });
            const dto = plainToInstance(UpdateInventoryAreaDto, { name: area.name });
            const result = await service.update(area.id, dto);
            expect(result.name).toBe(area.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const area = await areaRepo.findOneOrFail({ where: { id: areas[2].id } });
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: `${P}-area-renamed`,
            });
            await service.update(area.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await areaRepo.findOneOrFail({ where: { id: area.id } });
            expect(row.name).toBe(`${P}-area-renamed`);
        });
    });
});
