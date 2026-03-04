import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { GRAM, VOLUME } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureService } from './unit-of-measure.service';

class TestableUnitOfMeasureService extends UnitOfMeasureService {
    async createEntityForTest(
        dto: CreateUnitOfMeasureDto,
        manager: EntityManager,
    ): Promise<UnitOfMeasure> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateUnitOfMeasureDto,
        entity: UnitOfMeasure,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

describe('UnitOfMeasureService', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let unitService: TestableUnitOfMeasureService;
    let dataSource: DataSource;
    let unitRepo: Repository<UnitOfMeasure>;
    let categoryRepo: Repository<UnitOfMeasureCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getUnitOfMeasureTestingModule({
            unitOfMeasureServiceClass: TestableUnitOfMeasureService,
        });

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(
            UnitOfMeasureTestingUtil,
        );
        await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

        unitService = module.get(UnitOfMeasureService) as TestableUnitOfMeasureService;
        unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
        categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));

        dataSource = module.get(DataSource);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('unitService should be defined', () => {
        expect(unitService).toBeDefined();
    });

    // test createEntity()
    it('should create unit of measure', async () => {
        const cat = await categoryRepo.findOne({ where: { name: VOLUME } });
        if (!cat) throw new Error('category not found');
        const dto = plainToInstance(CreateUnitOfMeasureDto, {
            name: 'newunit',
            abbreviation: 'nu',
            conversionFactorToBase: '1',
            categoryId: cat.id,
        });

        await dataSource.transaction(async (manager) => {
            const result = await unitService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.name).toEqual(dto.name);
            expect(result.abbreviation).toEqual(dto.abbreviation);
        });
    });

    // test updateEntity()
    it('should update unit of measure', async () => {
        const unit = await unitRepo.findOne({ where: { name: GRAM } });
        if (!unit) throw new Error('unit not found');

        const dto = plainToInstance(UpdateUnitOfMeasureDto, { name: 'Gram Updated', abbreviation: 'g-up' });

        await dataSource.transaction(async (manager) => {
            await unitService.updateEntityForTest(dto, unit, manager);
        });

        const result = await unitRepo.findOne({ where: { id: unit.id } });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(dto.name);
        expect(result.abbreviation).toEqual(dto.abbreviation);
    });

    // test findAll()
    it('should find all unit of measures', async () => {
        const repoResult = await unitRepo.find();
        const serviceResult = await unitService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with search by name
    it('should find all unit of measures with search by name', async () => {
        const serviceResult = await unitService.findAll({
            search: 'gram',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
        expect(serviceResult?.items.every((u) => u.name.toLowerCase().includes('gram'))).toBe(true);
    });

    // test findAll() with filter by category
    it('should find all unit of measures with filter by category', async () => {
        const cat = await categoryRepo.findOne({ where: { name: VOLUME } });
        if (!cat) throw new Error('category not found');
        const repoResult = await unitRepo.find({ where: { category: { id: cat.id } } });
        const serviceResult = await unitService.findAll({
            filters: [`category=${cat.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with sortBy category
    it('should find all unit of measures with sortBy category', async () => {
        const serviceResult = await unitService.findAll({
            sortBy: 'category',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
    });

    // test findAll() with sortBy name
    it('should find all unit of measures with sortBy name', async () => {
        const repoResult = await unitRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await unitService.findAll({
            sortBy: 'name',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
        }
    });

    // test findOne()
    it('should find one unit of measure', async () => {
        const unit = await unitRepo.find({ take: 1 });
        if (!unit.length) throw new Error('unit not found');

        const serviceResult = await unitService.findOne(unit[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(unit[0].id);
    });

    // test findOne() with relations
    it('should find one unit of measure with relations', async () => {
        const unit = await unitRepo.find({ take: 1 });
        if (!unit.length) throw new Error('unit not found');

        const serviceResult = await unitService.findOne(unit[0].id, ['category']);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(unit[0].id);
        expect(serviceResult?.category).toBeDefined();
    });

    // test remove()
    it('should remove unit of measure', async () => {
        const unit = await unitRepo.findOne({ where: { name: 'newunit' } });
        if (!unit) throw new Error('unit not found (create "newunit" first)');
        const id = unit.id;

        const deleteResult = await unitService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(unitService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
