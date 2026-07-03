import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryValidator } from './menu-item-category.validator';

const P = `t${Date.now()}`;

describe('menu item category validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let validator: MenuItemCategoryValidator;
    let categoryRepo: Repository<MenuItemCategory>;

    let categories: MenuItemCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        validator = module.get<MenuItemCategoryValidator>(MenuItemCategoryValidator);
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

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateMenuItemCategoryDto = plainToInstance(CreateMenuItemCategoryDto, {
            name: `${P}-new-category`,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateMenuItemCategoryDto = plainToInstance(CreateMenuItemCategoryDto, {
            name: categories[0].name,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateMenuItemCategoryDto = plainToInstance(UpdateMenuItemCategoryDto, {
            name: `${P}-updated-name`,
        });
        const errors = await validator.validateDto(dto, categories[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateMenuItemCategoryDto = plainToInstance(UpdateMenuItemCategoryDto, {
            name: categories[1].name,
        });
        const errors = await validator.validateDto(dto, categories[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
