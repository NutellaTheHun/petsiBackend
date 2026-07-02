import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { menuItemCategoryToUpdateDto } from '../utils/entity-transformers/menu-item-category.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryService } from './menu-item-category.service';

class TestableMenuItemCategoryService extends MenuItemCategoryService {
    async createEntityForTest(
        dto: CreateMenuItemCategoryDto,
        manager: EntityManager,
    ): Promise<MenuItemCategory> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateMenuItemCategoryDto,
        entity: MenuItemCategory,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('menu item category service', () => {
    let testingUtil: MenuItemTestingUtil;
    let service: TestableMenuItemCategoryService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let categoryRepo: Repository<MenuItemCategory>;

    let categories: MenuItemCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemCategoryServiceClass: TestableMenuItemCategoryService,
        });
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        service = module.get<MenuItemCategoryService>(
            MenuItemCategoryService,
        ) as TestableMenuItemCategoryService;
        dataSource = module.get(DataSource);
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));

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
        let created: MenuItemCategory;

        it('should create category', async () => {
            const dto = plainToInstance(CreateMenuItemCategoryDto, { name: `${P}-create-test` });
            await dataSource.transaction(async (manager) => {
                created = await service.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
            testCtx.addCleanupFunction(async () => { await categoryRepo.delete(created.id); });
        });

        it('should update category', async () => {
            const dto = plainToInstance(UpdateMenuItemCategoryDto, { name: `${P}-create-updated` });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, created, manager);
            });
            const reloaded = await categoryRepo.findOneOrFail({ where: { id: created.id } });
            expect(reloaded.name).toBe(`${P}-create-updated`);
        });

        it('should remove category', async () => {
            await service.remove(created.id);
            await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded category in findAll results', async () => {
        const result = await service.findAll();
        const found = result.items.find((c) => c.id === categories[0].id);
        expect(found).toBeDefined();
    });

    it('should find one category with relations', async () => {
        const result = await service.findOne(categories[0].id, ['menuItems']);
        expect(result.id).toBe(categories[0].id);
        expect(Array.isArray(result.menuItems)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(MenuItemCategoryService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const cat = categories[0];
            const dto = menuItemCategoryToUpdateDto(cat);
            await service.update(cat.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const cat = categories[1];
            const dto = menuItemCategoryToUpdateDto(cat, { name: `${P}-cat-renamed` });
            await service.update(cat.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await categoryRepo.findOneOrFail({ where: { id: cat.id } });
            expect(row.name).toBe(`${P}-cat-renamed`);
        });
    });
});
