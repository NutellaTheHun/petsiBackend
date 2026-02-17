import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import {
    DRY_C,
    FOOD_A,
    FOOD_B,
    FOOD_C,
    PACKAGE_PKG,
} from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { AREA_A, AREA_C } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

describe('inventory area item validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryAreaItemValidator;

    let areaItemRepo: Repository<InventoryAreaItem>;
    let areaCountRepo: Repository<InventoryAreaCount>;
    let itemRepo: Repository<InventoryItem>;
    let itemSizeRepo: Repository<InventoryItemSize>;

    let measureRepo: Repository<UnitOfMeasure>;
    let packageRepo: Repository<InventoryItemPackage>;

    const findAreaItem = async (name: string) => {
        return await areaItemRepo.findOneOrFail({ where: { parentInventoryCount: { inventoryArea: { name } } }, relations: ['countedItem', 'countedItemSize'] });
    }

    const findInventoryItem = async (name: string) => {
        return await itemRepo.findOneOrFail({ where: { name }, relations: ['sizes'] });
    }

    const findPackage = async (name: string) => {
        return await packageRepo.findOneOrFail({ where: { name } });
    }

    const findUom = async (name: string) => {
        return await measureRepo.findOneOrFail({ where: { name } });
    }

    const findCount = async (name: string) => {
        return await areaCountRepo.findOneOrFail({
            where: { inventoryArea: { name } },
            relations: [
                'countedInventoryItems',
                'countedInventoryItems.countedItemSize',
                'countedInventoryItems.countedInventoryItem']
        });
    }

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        validator = module.get<InventoryAreaItemValidator>(
            InventoryAreaItemValidator,
        );

        areaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
        areaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        itemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
        measureRepo = module.get(getRepositoryToken(UnitOfMeasure));
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
        const count = await findCount(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 2,
            countedItemSize: {
                createId: 'c1',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
                cost: 1.99,
            },
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');

        expect(errors).toBeNull();
    });

    it('fail validate create: amount with value 0', async () => {
        const count = await findCount(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 0,
            countedItemSizeId: food_a.sizes[0].id,
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['amount']),
        );
    });

    it('fail validate create: inventoryItemSizeId and countedItemSize both provided', async () => {
        const count = await findCount(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 2,
            countedItemSizeId: food_a.sizes[0].id,
            countedItemSize: {
                createId: 'c1',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
                cost: 1.99,
            },
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', [], ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate create: neither inventoryItemSizeId nor countedItemSize provided', async () => {
        const count = await findCount(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 2,
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', [], ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate create: countedInventoryItemId with invalid countedItemSizeId', async () => {
        const count = await findCount(AREA_C);
        const food_c = await findInventoryItem(FOOD_C);
        const food_b = await findInventoryItem(FOOD_B);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_c.id,
            amount: 1,
            countedItemSizeId: food_b.sizes[0].id,
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['countedItemSize']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const count = await findCount(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 2,
            countedItemSize: {
                createId: 'c1',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 0,
                cost: 1.99,
            },
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');

        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedItemSize', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const count = await findCount(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 2,
            countedItemSize: {
                createId: 'c1',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
                cost: -1,
            },
            parentInventoryCountId: count.id,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedItemSize', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: 5,
            countedItemSizeId: food_a.sizes[0].id,
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expect(errors).toBeNull();
    });

    it('fail validate update: amount with value 0', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: itemToUpdate.countedInventoryItem.id,
            amount: 0,
            countedItemSizeId: itemToUpdate.countedItemSize.id,
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['amount']),
        );
    });

    it('fail validate update: countedItemSizeId with invalid for existing countedInventoryItem', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);

        const dry_c = await findInventoryItem(DRY_C);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: itemToUpdate.countedInventoryItem.id,
            amount: itemToUpdate.amount,
            countedItemSizeId: dry_c.sizes[0].id,
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['countedItemSize']),
        );
    });

    it('fail validate update: countedInventoryItemId with invalid countedItemSizeId', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);

        const food_c = await findInventoryItem(FOOD_C);
        const food_b = await findInventoryItem(FOOD_B);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: food_c.id,
            amount: itemToUpdate.amount,
            countedItemSizeId: food_b.sizes[0].id,
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['countedItemSize']),
        );
    });

    it('fail validate update: countedItemSizeId and countedItemSize both provided', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: itemToUpdate.countedInventoryItem.id,
            amount: itemToUpdate.amount,
            countedItemSizeId: itemToUpdate.countedItemSize.id,
            countedItemSize: {
                createId: 'c1',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
                cost: 1.99,
            },
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', [], ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate update: countedInventoryItemId with no sizeId or sizeDto', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);
        const food_a = await findInventoryItem(FOOD_A);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: food_a.id,
            amount: itemToUpdate.amount,
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', [], ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: itemToUpdate.countedInventoryItem.id,
            amount: itemToUpdate.amount,
            countedItemSize: {
                id: itemToUpdate.countedItemSize.id,
                measureAmount: 0,
                packageId: pkg.id,
                measureTypeId: uom.id,
                cost: null
            },
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedItemSize', id: itemToUpdate.countedItemSize.id },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: itemToUpdate.countedInventoryItem.id,
            amount: itemToUpdate.amount,
            countedItemSize: {
                id: itemToUpdate.countedItemSize.id,
                cost: -1,
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
            },
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedItemSize', id: itemToUpdate.countedItemSize.id },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });

    it('fail validate update: nestedUpdateInventoryItemSizeDto errors: already exists', async () => {
        const itemToUpdate = await findAreaItem(AREA_A);

        // Find another size with the same item that has different package/measureType
        const existingSizes = await itemSizeRepo.find({
            where: { inventoryItem: { id: itemToUpdate.countedInventoryItem.id } },
            relations: ['package', 'measureType'],
        });

        // Find a size that exists but is different from the current one
        const targetSize = existingSizes.find(
            (size) => size.id !== itemToUpdate.countedItemSize.id,
        );

        if (!targetSize) {
            throw new Error('target size not found');
        }

        const dto: UpdateInventoryAreaItemDto = {
            countedInventoryItemId: itemToUpdate.countedInventoryItem.id,
            amount: itemToUpdate.amount,
            countedItemSize: {
                id: itemToUpdate.countedItemSize.id,
                packageId: targetSize.package.id,
                measureTypeId: targetSize.measureType.id,
                measureAmount: 1,
                cost: null
            },
        };

        const errors = await validator.validateDto(dto, itemToUpdate.id);

        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedItemSize', id: itemToUpdate.countedItemSize.id },
            ],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['measureType', 'package', 'measureAmount']),
        );
    });
});
