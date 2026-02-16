import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { FOOD_A, FOOD_CAT, PACKAGE_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemValidator } from './inventory-item.validator';

describe('inventory item validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemValidator;
    let itemRepo: Repository<InventoryItem>;

    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let unitRepo: Repository<UnitOfMeasure>;
    let packageRepo: Repository<InventoryItemPackage>;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

        validator = module.get<InventoryItemValidator>(InventoryItemValidator);

        itemRepo = module.get(getRepositoryToken(InventoryItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create with no validation errors', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!category) {
            throw new Error('category not found');
        }
        const vendor = await vendorRepo.findOne({});
        if (!vendor) {
            throw new Error('vendor not found');
        }
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        if (!pkg) {
            throw new Error('package not found');
        }
        const uom = await unitRepo.findOne({ where: { name: POUND } });
        if (!uom) {
            throw new Error('uom not found');
        }

        const dto: CreateInventoryItemDto = {
            name: 'New Item Name',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 5,
                    cost: 10.99,
                },
                {
                    createId: 'c2',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 10,
                    cost: 20.99,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!category) {
            throw new Error('category not found');
        }
        const vendor = await vendorRepo.findOne({});
        if (!vendor) {
            throw new Error('vendor not found');
        }

        const dto: CreateInventoryItemDto = {
            name: FOOD_A,
            categoryId: category.id,
            vendorId: vendor.id,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['name']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!category) {
            throw new Error('category not found');
        }
        const vendor = await vendorRepo.findOne({});
        if (!vendor) {
            throw new Error('vendor not found');
        }
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        if (!pkg) {
            throw new Error('package not found');
        }
        const uom = await unitRepo.findOne({ where: { name: POUND } });
        if (!uom) {
            throw new Error('uom not found');
        }

        const dto: CreateInventoryItemDto = {
            name: 'New Item Name',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 0,
                    cost: 10.99,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!category) {
            throw new Error('category not found');
        }
        const vendor = await vendorRepo.findOne({});
        if (!vendor) {
            throw new Error('vendor not found');
        }
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        if (!pkg) {
            throw new Error('package not found');
        }
        const uom = await unitRepo.findOne({ where: { name: POUND } });
        if (!uom) {
            throw new Error('uom not found');
        }

        const dto: CreateInventoryItemDto = {
            name: 'New Item Name',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 5,
                    cost: -1,
                },
            ],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = await itemRepo.findOne({
            where: { name: FOOD_A },
            relations: ['category', 'vendor'],
        });
        if (!itemToUpdate) {
            throw new Error('item not found');
        }
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        if (!pkg) {
            throw new Error('package not found');
        }
        const uom = await unitRepo.findOne({ where: { name: POUND } });
        if (!uom) {
            throw new Error('uom not found');
        }

        const categories = await categoryRepo.find();
        const newCategory = categories.find(
            (c) => c.id !== itemToUpdate.category?.id,
        );
        if (!newCategory) {
            throw new Error('new category not found');
        }
        const vendors = await vendorRepo.find();
        const newVendor = vendors.find((v) => v.id !== itemToUpdate.vendor?.id);
        if (!newVendor) {
            throw new Error('new vendor not found');
        }

        const existingSizes = await itemRepo.findOne({
            where: { id: itemToUpdate.id },
            relations: ['sizes'],
        });
        if (
            !existingSizes ||
            !existingSizes.sizes ||
            existingSizes.sizes.length === 0
        ) {
            throw new Error('item sizes not found');
        }

        const dto: UpdateInventoryItemDto = {
            name: 'Updated Item Name',
            categoryId: newCategory.id,
            vendorId: newVendor.id,
            sizes: [
                {
                    id: existingSizes.sizes[0].id,
                    measureAmount: 15,
                    cost: 25.99,
                } as NestedUpdateInventoryItemSizeDto,
                {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 20,
                    cost: 30.99,
                },
            ],
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const items = await itemRepo.find({ relations: ['category', 'vendor'] });
        if (items.length < 2) {
            throw new Error('Not enough items for test');
        }

        const itemToUpdate = items[0];
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }
        const existingItem = items[1];

        const dto: UpdateInventoryItemDto = {
            name: existingItem.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [],
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['name']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = await itemRepo.findOne({
            where: { name: FOOD_A },
            relations: ['sizes', 'category', 'vendor'],
        });
        if (!itemToUpdate) {
            throw new Error('item not found');
        }
        if (!itemToUpdate.sizes || itemToUpdate.sizes.length === 0) {
            throw new Error('item sizes not found');
        }
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }

        const dto: UpdateInventoryItemDto = {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [
                {
                    id: itemToUpdate.sizes[0].id,
                    measureAmount: 0,
                } as NestedUpdateInventoryItemSizeDto,
            ],
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'sizes', id: itemToUpdate.sizes[0].id },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = await itemRepo.findOne({
            where: { name: FOOD_A },
            relations: ['sizes', 'category', 'vendor'],
        });
        if (!itemToUpdate) {
            throw new Error('item not found');
        }
        if (!itemToUpdate.sizes || itemToUpdate.sizes.length === 0) {
            throw new Error('item sizes not found');
        }
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }

        const dto: UpdateInventoryItemDto = {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [
                {
                    id: itemToUpdate.sizes[0].id,
                    cost: -1,
                } as NestedUpdateInventoryItemSizeDto,
            ],
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: itemToUpdate.sizes[0].id }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = await itemRepo.findOne({ where: { name: FOOD_A }, relations: ['category', 'vendor'] });
        if (!itemToUpdate) {
            throw new Error('item not found');
        }
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        if (!pkg) {
            throw new Error('package not found');
        }
        const uom = await unitRepo.findOne({ where: { name: POUND } });
        if (!uom) {
            throw new Error('uom not found');
        }

        const dto: UpdateInventoryItemDto = {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [
                {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 0,
                    cost: 10.99,
                },
            ],
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = await itemRepo.findOne({ where: { name: FOOD_A }, relations: ['category', 'vendor'] });
        if (!itemToUpdate) {
            throw new Error('item not found');
        }
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        if (!pkg) {
            throw new Error('package not found');
        }
        const uom = await unitRepo.findOne({ where: { name: POUND } });
        if (!uom) {
            throw new Error('uom not found');
        }

        const dto: UpdateInventoryItemDto = {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [
                {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 5,
                    cost: -1,
                },
            ],
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'sizes', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });
});
