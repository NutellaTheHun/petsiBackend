import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { FOOD_A, FOOD_CAT, PACKAGE_PKG, VENDOR_A } from '../utils/constants';
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

    const findInventoryItem = async (name: string) => {
        return await itemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'sizes.package', 'sizes.measureType', 'category', 'vendor'] });
    }

    const findInventoryItemCategory = async (name: string) => {
        return await categoryRepo.findOneOrFail({ where: { name } });
    }

    const findInventoryItemVendor = async (name: string) => {
        return await vendorRepo.findOneOrFail({ where: { name } });
    }

    const findInventoryItemPackage = async (name: string) => {
        return await packageRepo.findOneOrFail({ where: { name } });
    }

    const findUnitOfMeasure = async (name: string) => {
        return await unitRepo.findOneOrFail({ where: { name } });
    }

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
        const category = await findInventoryItemCategory(FOOD_CAT);
        const vendor = await findInventoryItemVendor(VENDOR_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: 'New Item Name',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 5,
                    cost: 10.99,
                }),
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c2',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 10,
                    cost: 20.99,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const category = await findInventoryItemCategory(FOOD_CAT);
        const vendor = await findInventoryItemVendor(VENDOR_A);

        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: FOOD_A,
            categoryId: category.id,
            vendorId: vendor.id,
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
        const category = await findInventoryItemCategory(FOOD_CAT);
        const vendor = await findInventoryItemVendor(VENDOR_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: 'New Item Name',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
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
        const category = await findInventoryItemCategory(FOOD_CAT);
        const vendor = await findInventoryItemVendor(VENDOR_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateInventoryItemDto = plainToInstance(CreateInventoryItemDto, {
            name: 'New Item Name',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
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

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = await findInventoryItem(FOOD_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

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

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: 'Updated Item Name',
            categoryId: newCategory.id,
            vendorId: newVendor.id,
            sizes: [
                plainToInstance(NestedUpdateInventoryItemSizeDto, {
                    id: itemToUpdate.sizes[0].id,
                    packageId: itemToUpdate.sizes[0].package.id,
                    measureTypeId: itemToUpdate.sizes[0].measureType.id,
                    measureAmount: itemToUpdate.sizes[0].measureAmount,
                    cost: itemToUpdate.sizes[0].cost,
                }),
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
                    measureAmount: 20,
                    cost: 30.99,
                }),
            ],
        });

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

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: existingItem.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [],
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = await findInventoryItem(FOOD_A);
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }

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
            [
                { prop: 'sizes', id: itemToUpdate.sizes[0].id },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = await findInventoryItem(FOOD_A);
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
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
        const itemToUpdate = await findInventoryItem(FOOD_A);
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }

        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
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
        const itemToUpdate = await findInventoryItem(FOOD_A);
        if (!itemToUpdate.category) {
            throw new Error('item category not found');
        }
        if (!itemToUpdate.vendor) {
            throw new Error('item vendor not found');
        }
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: UpdateInventoryItemDto = plainToInstance(UpdateInventoryItemDto, {
            name: itemToUpdate.name,
            categoryId: itemToUpdate.category?.id,
            vendorId: itemToUpdate.vendor?.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: uom.id,
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
