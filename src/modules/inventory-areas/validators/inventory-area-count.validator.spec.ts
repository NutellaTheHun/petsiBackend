import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
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
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A, AREA_B, AREA_C } from '../utils/constants';
import { inventoryAreaCountToUpdateDto } from '../utils/entity-transformers/inventory-area-count.dto.transformer';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountValidator } from './inventory-area-count.validator';

describe('inventory area count validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryAreaCountValidator;
    let countRepo: Repository<InventoryAreaCount>;
    let areaRepo: Repository<InventoryArea>;
    let itemRepo: Repository<InventoryItem>;
    let packageRepo: Repository<InventoryItemPackage>;
    let uomRepo: Repository<UnitOfMeasure>;

    const findArea = async (name: string) => {
        return await areaRepo.findOneOrFail({ where: { name } });
    }

    const findItem = async (name: string) => {
        return await itemRepo.findOneOrFail({ where: { name }, relations: ['sizes'] });
    }

    const findPackage = async (name: string) => {
        return await packageRepo.findOneOrFail({ where: { name } });
    }

    const findUom = async (name: string) => {
        return await uomRepo.findOneOrFail({ where: { name } });
    }

    const findCountByAreaName = async (name: string) => {
        return await countRepo.findOneOrFail({
            where: { inventoryArea: { name } },
            relations: [
                'inventoryArea',
                'countedInventoryItems',
                'countedInventoryItems.countedItemSize',
                'countedInventoryItems.countedItemSize.measureType',
                'countedInventoryItems.countedItemSize.package',
                'countedInventoryItems.countedItemSize.inventoryItem',
                'countedInventoryItems.countedInventoryItem']
        });
    }

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        validator = module.get<InventoryAreaCountValidator>(
            InventoryAreaCountValidator,
        );

        countRepo = module.get(getRepositoryToken(InventoryAreaCount));
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        uomRepo = module.get(getRepositoryToken(UnitOfMeasure));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create no validation errors', async () => {
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);
        const food_b = await findItem(FOOD_B);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_a.id,
                    amount: 2,
                    countedItemSizeId: food_a.sizes[0].id,
                }),
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c2',
                    countedInventoryItemId: food_b.id,
                    amount: 3,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c3',
                        packageId: pkg.id,
                        measureTypeId: uom.id,
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
        const area = await findArea(AREA_B);
        const food_b = await findItem(FOOD_B);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_b.id,
                    amount: 0,
                    countedItemSizeId: food_b.sizes[0].id,
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
        const area = await findArea(AREA_C);
        const food_c = await findItem(FOOD_C);
        const food_b = await findItem(FOOD_B);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_c.id,
                    amount: 1,
                    countedItemSizeId: food_b.sizes[0].id,
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
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_a.id,
                    amount: 2,
                    countedItemSizeId: food_a.sizes[0].id,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c2',
                        packageId: pkg.id,
                        measureTypeId: uom.id,
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
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_a.id,
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
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);
        const food_b = await findItem(FOOD_B);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_a.id,
                    amount: 2,
                    countedItemSizeId: food_a.sizes[0].id,
                }),
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c2',
                    countedInventoryItemId: food_b.id,
                    amount: 3,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c3',
                        packageId: pkg.id,
                        measureTypeId: uom.id,
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
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);
        const food_b = await findItem(FOOD_B);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto: CreateInventoryAreaCountDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: food_a.id,
                    amount: 2,
                    countedItemSizeId: food_a.sizes[0].id,
                }),
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c2',
                    countedInventoryItemId: food_b.id,
                    amount: 3,
                    countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'c3',
                        packageId: pkg.id,
                        measureTypeId: uom.id,
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
        const countToUpdate = await findCountByAreaName(AREA_A);
        const newArea = await findArea(AREA_B);
        const food_a = await findItem(FOOD_A);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        transform.countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: food_a.id,
            amount: 1,
            countedItemSizeId: food_a.sizes[0].id,
        }));

        const dto = plainToInstance(UpdateInventoryAreaCountDto, { ...transform, inventoryAreaId: newArea.id });

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {
        const countToUpdate = await findCountByAreaName(AREA_A);
        const food_a = await findItem(FOOD_A);

        const dto = inventoryAreaCountToUpdateDto(countToUpdate);
        dto.countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: food_a.id,
            amount: 0,
            countedItemSizeId: food_a.sizes[0].id,
        }));

        const errors = await validator.validateDto(dto, countToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'countedInventoryItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['amount']),
        );
    });

    it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
        const countToUpdate = await findCountByAreaName(AREA_A);
        const food_a = await findItem(FOOD_A);
        const food_b = await findItem(FOOD_B);

        const dto = inventoryAreaCountToUpdateDto(countToUpdate);
        dto.countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: food_a.id,
            amount: 1,
            countedItemSizeId: food_b.sizes[0].id,
        }));

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
        const countToUpdate = await findCountByAreaName(AREA_A);
        const food_a = await findItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto = inventoryAreaCountToUpdateDto(countToUpdate);
        dto.countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: food_a.id,
            amount: 1,
            countedItemSizeId: food_a.sizes[0].id,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c2',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
                cost: 1.99,
            }),
        }));

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
        const countToUpdate = await findCountByAreaName(AREA_A);
        const food_a = await findItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto = inventoryAreaCountToUpdateDto(countToUpdate);
        dto.countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: food_a.id,
            amount: 1,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c2',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 0,
                cost: 1.99,
            }),
        }));

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
        const countToUpdate = await findCountByAreaName(AREA_A);
        const food_a = await findItem(FOOD_A);
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const dto = inventoryAreaCountToUpdateDto(countToUpdate);
        dto.countedInventoryItems.push(plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c1',
            countedInventoryItemId: food_a.id,
            amount: 1,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c2',
                packageId: pkg.id,
                measureTypeId: uom.id,
                measureAmount: 1,
                cost: -1,
            }),
        }));

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
        const countToUpdate = await findCountByAreaName(AREA_A);
        const dry_c = await findItem(DRY_C);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);

        const countedInventoryItems = transform.countedInventoryItems.slice(1);
        countedInventoryItems.push(plainToInstance(NestedUpdateInventoryAreaItemDto, {
            id: countToUpdate.countedInventoryItems[0].id,
            countedItemSizeId: dry_c.sizes[0].id,
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
        const countToUpdate = await findCountByAreaName(AREA_A);
        const invItem = countToUpdate.countedInventoryItems[0]
        const pkg = await findPackage(PACKAGE_PKG);
        const uom = await findUom(POUND);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = transform.countedInventoryItems.slice(1);
        countedInventoryItems.push(plainToInstance(NestedUpdateInventoryAreaItemDto, {
            id: invItem.id,
            countedInventoryItemId: invItem.countedInventoryItem.id,
            amount: invItem.amount,
            countedItemSizeId: invItem.countedItemSize.id,
            countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                createId: 'c1',
                packageId: pkg.id,
                measureTypeId: uom.id,
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