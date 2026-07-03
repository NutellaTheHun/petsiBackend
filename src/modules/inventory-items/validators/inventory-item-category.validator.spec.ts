import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryValidator } from './inventory-item-category.validator';

const P = `t${Date.now()}`;

describe('inventory item category validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryItemCategoryValidator;
    let categoryRepo: Repository<InventoryItemCategory>;

    let categories: InventoryItemCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        validator = module.get<InventoryItemCategoryValidator>(InventoryItemCategoryValidator);
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));

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
        const dto: CreateInventoryItemCategoryDto = plainToInstance(CreateInventoryItemCategoryDto, {
            name: `${P}-new-category`,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryItemCategoryDto = plainToInstance(CreateInventoryItemCategoryDto, {
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
        const dto: UpdateInventoryItemCategoryDto = plainToInstance(UpdateInventoryItemCategoryDto, {
            name: `${P}-updated-name`,
        });
        const errors = await validator.validateDto(dto, categories[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateInventoryItemCategoryDto = plainToInstance(UpdateInventoryItemCategoryDto, {
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
