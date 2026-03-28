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
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { DAIRY_CAT, FOOD_CAT, OTHER_CAT } from '../utils/constants';
import { inventoryItemCategoryToUpdateDto } from '../utils/entity-transformers/inventory-item-category.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';
import { InventoryItemCategoryController } from './inventory-item-category.controller';

describe('Inventory Item Category Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryItemCategoryController;
    let categoryRepo: Repository<InventoryItemCategory>;

    beforeAll(async () => {
        module = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemCategoryTestDatabase(dbTestContext);

        controller = module.get<InventoryItemCategoryController>(
            InventoryItemCategoryController,
        );
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns categories aligned with repository', async () => {
        const repoRows = await categoryRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sort by name DESC', async () => {
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

    it('findOne returns seeded category', async () => {
        const row = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!row) throw new Error('category not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists category', async () => {
        const dto = plainToInstance(CreateInventoryItemCategoryDto, {
            name: 'ControllerCategoryX',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await categoryRepo.findOne({
            where: { name: 'ControllerCategoryX' },
        });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryItemCategoryDto, {
            name: FOOD_CAT,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) throw new Error('need 2 categories');
        const dto = plainToInstance(UpdateInventoryItemCategoryDto, {
            name: categories[1].name,
        });
        try {
            await controller.update(categories[0].id, dto);
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
        const dto = plainToInstance(UpdateInventoryItemCategoryDto, {
            name: 'Nope',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(
                InventoryItemCategoryService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const cat = await categoryRepo.findOne({ where: { name: OTHER_CAT } });
            if (!cat) throw new Error('cat');
            const dto = inventoryItemCategoryToUpdateDto(cat);
            await controller.update(cat.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const cat = await categoryRepo.findOne({
                where: { name: DAIRY_CAT },
            });
            if (!cat) throw new Error('cat');
            const dto = inventoryItemCategoryToUpdateDto(cat, {
                name: 'Dairy Cat Ctrl Renamed',
            });
            await controller.update(cat.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await categoryRepo.findOne({ where: { id: cat.id } });
            expect(row?.name).toEqual('Dairy Cat Ctrl Renamed');
        });
    });

    it('remove deletes created category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateInventoryItemCategoryDto, {
                name: 'ControllerRemoveCategory',
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
