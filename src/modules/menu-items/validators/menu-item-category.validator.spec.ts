import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { CAT_RED } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryValidator } from './menu-item-category.validator';

describe('menu item category validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemCategoryValidator;
    let categoryRepo: Repository<MenuItemCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);

        validator = module.get<MenuItemCategoryValidator>(
            MenuItemCategoryValidator,
        );

        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateMenuItemCategoryDto = {
            name: 'New Category Name',
        };

        const errors = await validator.validateCreateNode(dto);
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateMenuItemCategoryDto = {
            name: CAT_RED,
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Item with this name already exists',
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: CAT_RED },
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateMenuItemCategoryDto = {
            name: 'Updated Category Name',
        };

        const errors = await validator.validateUpdateNode(
            dto,
            categoryToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) {
            throw new Error('Not enough categories for test');
        }

        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];

        const dto: UpdateMenuItemCategoryDto = {
            name: existingCategory.name,
        };

        const errors = await validator.validateUpdateNode(
            dto,
            categoryToUpdate.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Item with this name already exists',
        );
    });
});
