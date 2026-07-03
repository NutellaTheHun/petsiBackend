import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryService } from './order-category.service';

class TestableOrderCategoryService extends OrderCategoryService {
    async createEntityForTest(
        dto: CreateOrderCategoryDto,
        manager: EntityManager,
    ): Promise<OrderCategory> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateOrderCategoryDto,
        entity: OrderCategory,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('order category service', () => {
    let service: TestableOrderCategoryService;
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let categoryRepo: Repository<OrderCategory>;

    let categories: OrderCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule({
            orderCategoryServiceClass: TestableOrderCategoryService,
        });
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dataSource = module.get(DataSource);
        service = module.get(OrderCategoryService) as TestableOrderCategoryService;
        categoryRepo = module.get(getRepositoryToken(OrderCategory));

        ({ categories } = await testingUtil.seedCategories(P));
    });

    afterAll(async () => {
        await categoryRepo.delete(categories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('category lifecycle', () => {
        let category: OrderCategory;

        it('should create category', async () => {
            const dto = plainToInstance(CreateOrderCategoryDto, {
                name: `${P}-lifecycle-category`,
            });

            await dataSource.transaction(async (manager) => {
                category = await service.createEntityForTest(dto, manager);
            });

            expect(category.id).toBeDefined();
            expect(category.name).toEqual(dto.name);
        });

        it('should update category', async () => {
            const dto = plainToInstance(UpdateOrderCategoryDto, {
                name: `${P}-lifecycle-category-updated`,
            });

            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, category, manager);
            });

            const result = await categoryRepo.findOneOrFail({ where: { id: category.id } });
            expect(result.name).toEqual(dto.name);
        });

        it('should remove category', async () => {
            const deleteResult = await service.remove(category.id);
            expect(deleteResult).toBe(true);
            await expect(service.findOne(category.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded category in findAll results', async () => {
        const serviceResult = await service.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        const found = serviceResult?.items.find((c) => c.id === categories[0].id);
        expect(found).toBeDefined();
    });

    it('should find one category with relations', async () => {
        const serviceResult = await service.findOne(categories[0].id, ['orders']);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(categories[0].id);
        expect(Array.isArray(serviceResult?.orders)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });
});
