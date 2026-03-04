import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { CAT_RED } from '../utils/constants';
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

describe('menu item category service', () => {
    let testingUtil: MenuItemTestingUtil;
    let categoryService: TestableMenuItemCategoryService;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let categoryRepo: Repository<MenuItemCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemCategoryServiceClass: TestableMenuItemCategoryService,
        });
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);

        categoryService = module.get(
            MenuItemCategoryService,
        ) as TestableMenuItemCategoryService;
        dataSource = module.get(DataSource);
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(categoryService).toBeDefined();
    });

    // test createEntity()
    it('should create category', async () => {
        const dto = plainToInstance(CreateMenuItemCategoryDto, { name: 'Merchandise' });

        await dataSource.transaction(async (manager) => {
            const result = await categoryService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.name).toEqual(dto.name);
        });
    });

    // test updateEntity()
    it('should update category', async () => {
        const cat = await categoryRepo.findOne({ where: { name: CAT_RED } });
        if (!cat) throw new Error('category not found');

        const dto = plainToInstance(UpdateMenuItemCategoryDto, { name: 'Category Red Updated' });

        await dataSource.transaction(async (manager) => {
            await categoryService.updateEntityForTest(dto, cat, manager);
        });

        const result = await categoryRepo.findOne({ where: { id: cat.id } });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(dto.name);
    });

    // test findAll()
    it('should find all categories', async () => {
        const repoResult = await categoryRepo.find();
        const serviceResult = await categoryService.findAll();
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with sort by name
    it('should find all categories with sort by name', async () => {
        const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await categoryService.findAll({
            sortBy: 'name',
            sortOrder: 'DESC',
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
        }
    });

    // test findOne()
    it('should find one category', async () => {
        const cat = await categoryRepo.find({ take: 1 });
        if (!cat.length) throw new Error('category not found');

        const serviceResult = await categoryService.findOne(cat[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(cat[0].id);
    });

    // test findOne() with relations
    it('should find one category with relations', async () => {
        const cat = await categoryRepo.find({
            take: 1,
            relations: ['menuItems'],
        });
        if (!cat.length) throw new Error('category not found');

        const serviceResult = await categoryService.findOne(cat[0].id, [
            'menuItems',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(cat[0].id);
        expect(serviceResult?.menuItems).toBeDefined();
        expect(Array.isArray(serviceResult?.menuItems)).toBe(true);
    });

    // test remove()
    it('should remove category', async () => {
        const cat = await categoryRepo.find({ take: 1 });
        if (!cat.length) throw new Error('category not found');
        const id = cat[0].id;

        const deleteResult = await categoryService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(categoryService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
