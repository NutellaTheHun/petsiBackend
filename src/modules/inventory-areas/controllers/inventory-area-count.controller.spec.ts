import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { MoreThan, Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import {
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
import { InventoryAreaCountService } from '../services/inventory-area-count.service';
import { AREA_A, AREA_B, AREA_C, AREA_D } from '../utils/constants';
import { inventoryAreaCountToUpdateDto } from '../utils/entity-transformers/inventory-area-count.dto.transformer';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountController } from './inventory-area-count.controller';

describe('inventory area count controller', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryAreaCountController;
    let countRepo: Repository<InventoryAreaCount>;
    let areaRepo: Repository<InventoryArea>;
    let itemRepo: Repository<InventoryItem>;
    let packageRepo: Repository<InventoryItemPackage>;
    let uomRepo: Repository<UnitOfMeasure>;

    const getInventoryAreaCount = async (areaName: string) => {
        return await countRepo.findOneOrFail({
            where: {
                inventoryArea: { name: areaName },
                countedInventoryItems: MoreThan(0),
            },
            relations: [
                'countedInventoryItems',
                'countedInventoryItems.countedInventoryItem',
                'countedInventoryItems.countedItemSize',
                'inventoryArea',
            ],
        });
    };

    const findArea = async (name: string) => {
        return await areaRepo.findOneOrFail({ where: { name } });
    };

    const findItem = async (name: string) => {
        return await itemRepo.findOneOrFail({
            where: { name },
            relations: ['sizes'],
        });
    };

    beforeAll(async () => {
        module = await getInventoryAreasTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        controller = module.get<InventoryAreaCountController>(
            InventoryAreaCountController,
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
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoCount = await countRepo.count();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoCount);
    });

    it('findOne returns a seeded count', async () => {
        const count = await countRepo.findOne({
            where: {},
            relations: ['inventoryArea'],
        });
        if (!count) throw new Error('no count in seed');
        const result = await controller.findOne(count.id);
        expect(result.id).toEqual(count.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new count with nested items', async () => {
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);
        const food_b = await findItem(FOOD_B);
        const pkg = await packageRepo.findOneOrFail({
            where: { name: PACKAGE_PKG },
        });
        const uom = await uomRepo.findOneOrFail({ where: { name: POUND } });

        const dto = plainToInstance(CreateInventoryAreaCountDto, {
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

        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await countRepo.findOne({
            where: { id: result.id },
            relations: ['countedInventoryItems'],
        });
        expect(row?.countedInventoryItems?.length).toEqual(2);
    });

    it('create throws ValidationException when nested item amount is invalid', async () => {
        const area = await findArea(AREA_B);
        const food_b = await findItem(FOOD_B);

        const dto = plainToInstance(CreateInventoryAreaCountDto, {
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

        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [{ prop: 'countedInventoryItems', id: 'c1' }],
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
                    'amount',
                ]),
            );
        }
    });

    it('update throws ValidationException when nested create item has invalid size for item', async () => {
        const countToUpdate = await getInventoryAreaCount(AREA_C);
        const food_c = await findItem(FOOD_C);
        const food_b = await findItem(FOOD_B);

        const transform = inventoryAreaCountToUpdateDto(countToUpdate);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        countedInventoryItems.push(
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: 'c1',
                countedInventoryItemId: food_c.id,
                amount: 1,
                countedItemSizeId: food_b.sizes[0].id,
            }),
        );
        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });

        try {
            await controller.update(countToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [{ prop: 'countedInventoryItems', id: 'c1' }],
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
                    'countedItemSize',
                ]),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const count = await getInventoryAreaCount(AREA_A);
        const dto = inventoryAreaCountToUpdateDto(count);
        await expect(
            controller.update(9_999_999, dto),
        ).rejects.toThrow(DatabaseException);
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                InventoryAreaCountService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current state', async () => {
            const count = await getInventoryAreaCount(AREA_D);
            const dto = inventoryAreaCountToUpdateDto(count);
            const result = await controller.update(count.id, dto);
            expect(result.id).toEqual(count.id);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when a nested item amount changes', async () => {
            const countToUpdate = await getInventoryAreaCount(AREA_B);
            const itemToUpdate = await findItem(FOOD_B);

            const transform = inventoryAreaCountToUpdateDto(countToUpdate);
            const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
            const areaItemToUpdate = countedInventoryItems.pop();
            const areaItemUpdateId = (areaItemToUpdate as NestedUpdateInventoryAreaItemDto)
                .id;
            countedInventoryItems.push(
                plainToInstance(NestedUpdateInventoryAreaItemDto, {
                    id: areaItemUpdateId,
                    countedInventoryItemId: itemToUpdate.id,
                    countedItemSizeId: itemToUpdate.sizes[0].id,
                    amount: 2,
                }),
            );
            const dto = plainToInstance(UpdateInventoryAreaCountDto, {
                ...transform,
                countedInventoryItems,
            });

            await controller.update(countToUpdate.id, dto);
            expect(updateEntitySpy).toHaveBeenCalled();

            const row = await countRepo.findOne({
                where: { id: countToUpdate.id },
                relations: ['countedInventoryItems'],
            });
            const updatedItem = row?.countedInventoryItems.find(
                (i) => i.id === areaItemUpdateId,
            );
            expect(updatedItem?.amount).toEqual(2);
        });
    });

    it('remove deletes a count then findOne fails', async () => {
        const area = await findArea(AREA_A);
        const food_a = await findItem(FOOD_A);
        const createDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: area.id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'cRm',
                    countedInventoryItemId: food_a.id,
                    amount: 1,
                    countedItemSizeId: food_a.sizes[0].id,
                }),
            ],
        });
        const created = await controller.create(createDto);
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
