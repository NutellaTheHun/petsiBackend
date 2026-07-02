import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountController } from './inventory-area-count.controller';

const P = `t${Date.now()}`;

describe('inventory area count controller', () => {
    let testingUtil: InventoryAreaTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: InventoryAreaCountController;
    let countRepo: Repository<InventoryAreaCount>;
    let areaRepo: Repository<InventoryArea>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let packageRepo: Repository<InventoryItemPackage>;
    let itemRepo: Repository<InventoryItem>;
    let sizeRepo: Repository<InventoryItemSize>;

    let areas: InventoryArea[];
    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);

        controller = module.get<InventoryAreaCountController>(
            InventoryAreaCountController,
        );
        countRepo = module.get(getRepositoryToken(InventoryAreaCount));
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));

        ({ areas } = await testingUtil.seedAreas(P));
        ({ categories, vendors, packages, items, sizes } =
            await testingUtil.seedInventoryItems(P));
    });

    afterAll(async () => {
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

    it('create throws ValidationException when nested item amount is invalid', async () => {
        const dto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'c1',
                    countedInventoryItemId: items[0].id,
                    amount: 0,
                    countedItemSizeId: sizes[0].id,
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

    it('remove deletes a count then findOne fails', async () => {
        const createDto = plainToInstance(CreateInventoryAreaCountDto, {
            inventoryAreaId: areas[0].id,
            countedInventoryItems: [
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: 'cRm',
                    countedInventoryItemId: items[0].id,
                    amount: 1,
                    countedItemSizeId: sizes[0].id,
                }),
            ],
        });
        const created = await controller.create(createDto);
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
