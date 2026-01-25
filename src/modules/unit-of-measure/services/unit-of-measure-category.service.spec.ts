import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { WEIGHT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryService } from './unit-of-measure-category.service';

class TestableUnitOfMeasureCategoryService extends UnitOfMeasureCategoryService {
  async createEntityForTest(
    dto: CreateUnitOfMeasureCategoryDto,
    manager: EntityManager,
  ): Promise<UnitOfMeasureCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateUnitOfMeasureCategoryDto,
    entity: UnitOfMeasureCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('UnitOfMeasureCategoryService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let categoryService: TestableUnitOfMeasureCategoryService;
  let categoryRepo: Repository<UnitOfMeasureCategory>;
  let unitRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule({
      unitOfMeasureCategoryServiceClass: TestableUnitOfMeasureCategoryService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UnitOfMeasureTestingUtil>(
      UnitOfMeasureTestingUtil,
    );
    await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

    categoryService = module.get(
      UnitOfMeasureCategoryService,
    ) as TestableUnitOfMeasureCategoryService;
    categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
    unitRepo = module.get(getRepositoryToken(UnitOfMeasure));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  // test createEntity()
  it('should create unit of measure category', async () => {
    const dto: CreateUnitOfMeasureCategoryDto = { name: 'length' };

    await dataSource.transaction(async (manager) => {
      const result = await categoryService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.name).toEqual(dto.name);
    });
  });

  // test updateEntity()
  it('should update unit of measure category', async () => {
    const cat = await categoryRepo.findOne({ where: { name: WEIGHT } });
    if (!cat) throw new Error('category not found');

    const dto: UpdateUnitOfMeasureCategoryDto = { name: 'Weight Updated' };

    await dataSource.transaction(async (manager) => {
      await categoryService.updateEntityForTest(dto, cat, manager);
    });

    const result = await categoryRepo.findOne({ where: { id: cat.id } });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
  });

  // test findAll()
  it('should find all unit of measure categories', async () => {
    const repoResult = await categoryRepo.find();
    const serviceResult = await categoryService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with sortBy name
  it('should find all unit of measure categories with sortBy name', async () => {
    const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
    const serviceResult = await categoryService.findAll({
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
  it('should find one unit of measure category', async () => {
    const cat = await categoryRepo.find({ take: 1 });
    if (!cat.length) throw new Error('category not found');

    const serviceResult = await categoryService.findOne(cat[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(cat[0].id);
  });

  // test findOne() with relations
  it('should find one unit of measure category with relations', async () => {
    const cat = await categoryRepo.find({ take: 1 });
    if (!cat.length) throw new Error('category not found');

    const serviceResult = await categoryService.findOne(cat[0].id, [
      'baseConversionUnit',
      'units',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(cat[0].id);
    expect(serviceResult?.units).toBeDefined();
    expect(Array.isArray(serviceResult?.units)).toBe(true);
  });

  // test remove()
  it('should remove unit of measure category', async () => {
    const cat = await categoryRepo.findOne({ where: { name: 'length' } });
    if (!cat) throw new Error('category not found (create "length" first)');
    const id = cat.id;

    const deleteResult = await categoryService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(categoryService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
