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
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { inventoryAreaCountToUpdateDto } from '../utils/entity-transformers/inventory-area-count.dto.transformer';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountValidator } from './inventory-area-count.validator';

const P = `t${Date.now()}`;

describe('inventory area count validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryAreaCountValidator;
    let countRepo: Repository<InventoryAreaCount>;
    let areaRepo: Repository<InventoryArea>;
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

    const reloadCount = async (id: number) =>
        countRepo.findOneOrFail({
            where: { id },
            relations: [
                'inventoryArea',
                'countedInventoryItems',
                'countedInventoryItems.countedItemSize',
                'countedInventoryItems.countedItemSize.package',
                'countedInventoryItems.countedItemSize.inventoryItem',
                'countedInventoryItems.countedInventoryItem',
            ],
        });

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);

        validator = module.get<InventoryAreaCountValidator>(
            InventoryAreaCountValidator,
        );

        countRepo = module.get(getRepositoryToken(InventoryAreaCount));
        areaRepo = module.get(getRepositoryToken(InventoryArea));
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
    it('successfully validate create no validation errors', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[0].id,
                    amount: 2,
                    countedItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c2',
                    countedInventoryItemId: items[1].id,
                    amount: 3,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c3',
                        packageId: packages[1].id,
                        unit: 'lb',
                        measureAmount: 1,
                        cost: 1.99,
                    }),
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'c1');
        expect(errors).toBeNull();
    });

    it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[1].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[1].id,
                    amount: 0,
                    countedItemSizeId: sizes[2].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'rootId');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedInventoryItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['amount']),
        );
    });

    it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[2].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[2].id,
                    amount: 1,
                    countedItemSizeId: sizes[2].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'rootId');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['countedItemSize']),
        );
    });

    it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[0].id,
                    amount: 2,
                    countedItemSizeId: sizes[0].id,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c2',
                        packageId: packages[1].id,
                        unit: 'lb',
                        measureAmount: 1,
                        cost: 1.99,
                    }),
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'rootId');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate create: nestedCreateInventoryAreaItemDto errors: neither inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId not provided', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[0].id,
                    amount: 2,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'rootId');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[0].id,
                    amount: 2,
                    countedItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c2',
                    countedInventoryItemId: items[1].id,
                    amount: 3,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c3',
                        packageId: packages[1].id,
                        unit: 'lb',
                        measureAmount: 0,
                        cost: 1.99,
                    }),
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'rootId');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c2' },
                { prop: 'countedItemSize', id: 'c3' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[0].id,
                    amount: 2,
                    countedItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c2',
                    countedInventoryItemId: items[1].id,
                    amount: 3,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c3',
                        packageId: packages[1].id,
                        unit: 'lb',
                        measureAmount: 1,
                        cost: -1,
                    }),
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'rootId');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c2' },
                { prop: 'countedItemSize', id: 'c3' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    // Update Validation Tests
    it('successfully validate update no validation errors', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: items[0].id,
            amount: 1,
            countedItemSizeId: sizes[0].id,
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            inventoryAreaId: areas[1].id,
            countedInventoryItems,
        });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: items[0].id,
            amount: 0,
            countedItemSizeId: sizes[0].id,
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedInventoryItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['amount']),
        );
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: items[0].id,
            amount: 1,
            countedItemSizeId: sizes[2].id,
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['countedItemSize']),
        );
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: items[0].id,
            amount: 1,
            countedItemSizeId: sizes[0].id,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c2',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: 1.99,
            }),
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: items[0].id,
            amount: 1,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c2',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 0,
                cost: 1.99,
            }),
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
                { prop: 'countedItemSize', id: 'c2' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: items[0].id,
            amount: 1,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c2',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: -1,
            }),
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'countedInventoryItems', id: 'c1' },
                { prop: 'countedItemSize', id: 'c2' },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
        const countToUpdate = await reloadCount(counts[0].id);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);

        const countedInventoryItems = (transform.countedInventoryItems ?? []).slice(1);
        countedInventoryItems.push(plainToInstance(NestedUpdateInventoryAreaItemDto, {
            id: countToUpdate.countedInventoryItems[0].id,
            countedItemSizeId: sizes[10].id,
            countedInventoryItemId: countToUpdate.countedInventoryItems[0].countedInventoryItem.id,
            amount: countToUpdate.countedInventoryItems[0].amount,
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, { ...transform, countedInventoryItems });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                {
                    prop: 'countedInventoryItems',
                    id: countToUpdate.countedInventoryItems[0].id,
                },
            ],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['countedItemSize']),
        );
    });

    it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {
        const countToUpdate = await reloadCount(counts[0].id);
        const invItem = countToUpdate.countedInventoryItems[0];

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = (transform.countedInventoryItems ?? []).slice(1);
        countedInventoryItems.push(plainToInstance(NestedUpdateInventoryAreaItemDto, {
            id: invItem.id,
            countedInventoryItemId: invItem.countedInventoryItem.id,
            amount: invItem.amount,
            countedItemSizeId: invItem.countedItemSize.id,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: packages[1].id,
                unit: 'lb',
                measureAmount: 1,
                cost: 1.99,
            }),
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, { ...transform, countedInventoryItems });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                {
                    prop: 'countedInventoryItems',
                    id: countToUpdate.countedInventoryItems[0].id,
                },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['countedItemSize', 'countedItemSizeId']),
        );
    });
});
