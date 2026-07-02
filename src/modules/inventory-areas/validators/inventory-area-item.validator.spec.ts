import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

const P = `t${Date.now()}`;

describe('inventory area item validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryAreaItemValidator;

    let countRepo: Repository<InventoryAreaCount>;
    let areaRepo: Repository<InventoryArea>;
    let areaItemRepo: Repository<InventoryAreaItem>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let packageRepo: Repository<InventoryItemPackage>;
    let itemRepo: Repository<InventoryItem>;
    let sizeRepo: Repository<InventoryItemSize>;

    let areas: InventoryArea[];
    let counts: InventoryAreaCount[];
    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];
    let areaItems: InventoryAreaItem[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);

        validator = module.get<InventoryAreaItemValidator>(
            InventoryAreaItemValidator,
        );

        countRepo = module.get(getRepositoryToken(InventoryAreaCount));
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        areaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));

        ({ areas, counts, categories, vendors, packages, items, sizes, areaItems } =
            await testingUtil.seedItemCounts(P));
    });

    afterAll(async () => {
        await countRepo.delete(counts.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
        await itemRepo.delete(items.map((i) => i.id));
        await packageRepo.delete(packages.map((p) => p.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await vendorRepo.delete(vendors.map((v) => v.id));
        await areaRepo.delete(areas.map((a) => a.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create with no validation errors', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 2,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: 1.99,
            }),
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: amount with value 0', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 0,
            countedItemSizeId: sizes[0].id,
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['amount']),
        );
    });

    it('fail validate create: inventoryItemSizeId and countedItemSize both provided', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 2,
            countedItemSizeId: sizes[0].id,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: 1.99,
            }),
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate create: neither inventoryItemSizeId nor countedItemSize provided', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 2,
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate create: countedInventoryItemId with invalid countedItemSizeId', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[2].id,
            amount: 1,
            countedItemSizeId: sizes[2].id,
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['countedItemSize']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 2,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 0,
                cost: 1.99,
            }),
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedItemSize', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const dto: CreateInventoryAreaItemDto = plainToInstance(CreateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 2,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: -1,
            }),
            parentInventoryCountId: counts[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedItemSize', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 5,
            countedItemSizeId: sizes[0].id,
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: amount with value 0', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: 0,
            countedItemSizeId: sizes[0].id,
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['amount']),
        );
    });

    it('fail validate update: countedItemSizeId with invalid for existing countedInventoryItem', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: itemToUpdate.amount,
            countedItemSizeId: sizes[10].id,
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['countedItemSize']),
        );
    });

    it('fail validate update: countedInventoryItemId with invalid countedItemSizeId', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[2].id,
            amount: itemToUpdate.amount,
            countedItemSizeId: sizes[2].id,
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['countedItemSize']),
        );
    });

    it('fail validate update: countedItemSizeId and countedItemSize both provided', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: itemToUpdate.amount,
            countedItemSizeId: sizes[0].id,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: 1.99,
            }),
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate update: countedInventoryItemId with no sizeId or sizeDto', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: itemToUpdate.amount,
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: itemToUpdate.amount,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                measureAmount: 0,
                packageId: packages[1].id,
                unit: 'lb',
                cost: null,
            }),
        });

        const errors = await validator.validateDto(dto, 'c1');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedItemSize', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = areaItems[0];

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: itemToUpdate.amount,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                cost: -1,
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
            }),
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedItemSize', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    it('fail validate update: nestedCreateInventoryItemSizeDto errors: already exists', async () => {
        const itemToUpdate = areaItems[0];

        // Find another size with the same item that has a different package/unit
        const existingSizes = await sizeRepo.find({
            where: { inventoryItem: { id: items[0].id } },
            relations: ['package'],
        });

        const targetSize = existingSizes.find(
            (size) => size.id !== sizes[0].id,
        );

        if (!targetSize) {
            throw new Error('target size not found');
        }

        const dto: UpdateInventoryAreaItemDto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[0].id,
            amount: itemToUpdate.amount,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: targetSize.package.id,
                unit: targetSize.unit,
                measureAmount: targetSize.measureAmount,
                cost: null,
            }),
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedItemSize', id: 'c1' },
            ],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['unit', 'package', 'measureAmount']),
        );
    });
});
