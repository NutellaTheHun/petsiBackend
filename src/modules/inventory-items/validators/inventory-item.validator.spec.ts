import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemValidator } from './inventory-item.validator';

const P = `t${Date.now()}`;

describe('inventory item validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryItemValidator;
    let itemRepo: Repository<InventoryItem>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let packageRepo: Repository<InventoryItemPackage>;
    let sizeRepo: Repository<InventoryItemSize>;

    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    const loadItem = (id: number) =>
        itemRepo.findOneOrFail({ where: { id }, relations: ['sizes', 'sizes.package', 'category', 'vendor'] });

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        validator = module.get<InventoryItemValidator>(InventoryItemValidator);
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));

        ({ categories, vendors, packages, items, sizes } = await testingUtil.seedSizes(P));
    });

    afterAll(async () => {
        await sizeRepo.delete(sizes.map((s) => s.id));
        await itemRepo.delete(items.map((i) => i.id));
        await packageRepo.delete(packages.map((p) => p.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await vendorRepo.delete(vendors.map((v) => v.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create with no validation errors', async () => {
        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: `${P}-new-item`,
            categoryId: categories[3].id,
            vendorId: vendors[0].id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: packages[0].id,
                    unit: 'lb',
                    measureAmount: 5,
                    cost: 10.99,
                }),
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c2',
                    packageId: packages[1].id,
                    unit: 'oz',
                    measureAmount: 10,
                    cost: 20.99,
                }),
            ],
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: items[0].name,
            categoryId: categories[3].id,
            vendorId: vendors[0].id,
            sizes: [],
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: `${P}-new-item-2`,
            categoryId: categories[3].id,
            vendorId: vendors[0].id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: packages[0].id,
                    unit: 'lb',
                    measureAmount: 0,
                    cost: 10.99,
                }),
            ],
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: `${P}-new-item-3`,
            categoryId: categories[3].id,
            vendorId: vendors[0].id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: packages[0].id,
                    unit: 'lb',
                    measureAmount: 5,
                    cost: -1,
                }),
            ],
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = await loadItem(items[0].id);
        const newCategory = categories.find((c) => c.id !== itemToUpdate.category?.id);
        if (!newCategory) throw new Error('new category not found');
        const newVendor = vendors.find((v) => v.id !== itemToUpdate.vendor?.id);
        if (!newVendor) throw new Error('new vendor not found');

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: `${P}-updated-item`,
            categoryId: newCategory.id,
            vendorId: newVendor.id,
            sizes: [
                plainToInstance(NestedUpdateInventoryItemSizeDto, {
                    id: itemToUpdate.sizes[0].id,
                    packageId: itemToUpdate.sizes[0].package.id,
                    unit: itemToUpdate.sizes[0].unit,
                    measureAmount: itemToUpdate.sizes[0].measureAmount,
                    cost: itemToUpdate.sizes[0].cost,
                }),
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: packages[4].id,
                    unit: 'oz',
                    measureAmount: 20,
                    cost: 30.99,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: items[1].name,
            categoryId: categories[3].id,
            vendorId: vendors[0].id,
            sizes: [],
        });
        const errors = await validator.validateDto(dto, items[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = await loadItem(items[0].id);
        if (!itemToUpdate.category || !itemToUpdate.vendor) throw new Error('item relations missing');

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category.id,
            vendorId: itemToUpdate.vendor.id,
            sizes: [
                plainToInstance(NestedUpdateInventoryItemSizeDto, {
                    id: itemToUpdate.sizes[0].id,
                    measureAmount: 0,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: itemToUpdate.sizes[0].id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = await loadItem(items[0].id);
        if (!itemToUpdate.category || !itemToUpdate.vendor) throw new Error('item relations missing');

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category.id,
            vendorId: itemToUpdate.vendor.id,
            sizes: [
                plainToInstance(NestedUpdateInventoryItemSizeDto, {
                    id: itemToUpdate.sizes[0].id,
                    cost: -1,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: itemToUpdate.sizes[0].id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = await loadItem(items[0].id);
        if (!itemToUpdate.category || !itemToUpdate.vendor) throw new Error('item relations missing');

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category.id,
            vendorId: itemToUpdate.vendor.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: packages[0].id,
                    unit: 'lb',
                    measureAmount: 0,
                    cost: 10.99,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = await loadItem(items[0].id);
        if (!itemToUpdate.category || !itemToUpdate.vendor) throw new Error('item relations missing');

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category.id,
            vendorId: itemToUpdate.vendor.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: packages[0].id,
                    unit: 'lb',
                    measureAmount: 5,
                    cost: -1,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });
});
