import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemCategoryService } from '../services/menu-item-category.service';
import {
    CAT_BLUE,
    CAT_ORANGE,
    CAT_RED,
} from '../utils/constants';
import { menuItemCategoryToUpdateDto } from '../utils/entity-transformers/menu-item-category.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryController } from './menu-item-category.controller';

describe('menu item category controller', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: MenuItemCategoryController;
    let categoryRepo: Repository<MenuItemCategory>;

    beforeAll(async () => {
        module = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);

        controller = module.get<MenuItemCategoryController>(
            MenuItemCategoryController,
        );
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await categoryRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            undefined,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns a seeded category', async () => {
        const cat = await categoryRepo.findOne({ where: { name: CAT_RED } });
        if (!cat) throw new Error('seed category not found');
        const result = await controller.findOne(cat.id);
        expect(result.id).toEqual(cat.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new category', async () => {
        const dto = plainToInstance(CreateMenuItemCategoryDto, {
            name: 'ControllerMenuItemCategoryNew',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await categoryRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateMenuItemCategoryDto, {
            name: CAT_RED,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides with another category', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) throw new Error('Not enough categories');

        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];
        const dto = plainToInstance(UpdateMenuItemCategoryDto, {
            name: existingCategory.name,
        });
        try {
            await controller.update(categoryToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateMenuItemCategoryDto, {
            name: 'DoesNotMatter',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                MenuItemCategoryService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current category', async () => {
            const cat = await categoryRepo.findOne({ where: { name: CAT_BLUE } });
            if (!cat) throw new Error('category blue not found');
            const dto = menuItemCategoryToUpdateDto(cat);
            const result = await controller.update(cat.id, dto);
            expect(result.name).toEqual(cat.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const cat = await categoryRepo.findOne({
                where: { name: CAT_ORANGE },
            });
            if (!cat) throw new Error('category orange not found');
            const newName = 'category orange controller renamed';
            const dto = menuItemCategoryToUpdateDto(cat, { name: newName });
            const result = await controller.update(cat.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await categoryRepo.findOne({ where: { id: cat.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateMenuItemCategoryDto, {
                name: 'ControllerMenuItemCategoryRemove',
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
