import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Like, Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import {
    DRY_A,
    FOOD_A,
    FOOD_B,
    FOOD_CAT,
    PACKAGE_PKG,
    VENDOR_A,
} from '../utils/constants';
import { inventoryItemToUpdateDto } from '../utils/entity-transformers/inventory-item.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemService } from '../services/inventory-item.service';
import { InventoryItemController } from './inventory-item.controller';

describe('Inventory Item Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryItemController;
    let itemRepo: Repository<InventoryItem>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let packageRepo: Repository<InventoryItemPackage>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let measureRepo: Repository<UnitOfMeasure>;

    beforeAll(async () => {
        module = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

        controller = module.get<InventoryItemController>(InventoryItemController);
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        measureRepo = module.get(getRepositoryToken(UnitOfMeasure));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await itemRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search by name', async () => {
        const repoResult = await itemRepo.find({
            where: { name: Like('%food%') },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'food',
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with filter by category', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        if (!category) throw new Error('category not found');
        const repoResult = await itemRepo.find({
            where: { category: { id: category.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`category=${category.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with filter by vendor', async () => {
        const vendor = await vendorRepo.findOne({ where: {} });
        if (!vendor) throw new Error('vendor not found');
        const repoResult = await itemRepo.find({
            where: { vendor: { id: vendor.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`vendor=${vendor.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with filter by category and vendor', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        const vendor = await vendorRepo.findOne({ where: {} });
        if (!category || !vendor) throw new Error('category or vendor not found');
        const repoResult = await itemRepo.find({
            where: {
                category: { id: category.id },
                vendor: { id: vendor.id },
            },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`category=${category.id}`, `vendor=${vendor.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with sort by name DESC', async () => {
        const repoResult = await itemRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findAll with sort by vendor DESC', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'vendor',
            'DESC',
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findAll with sort by category DESC', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'category',
            'DESC',
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findOne returns seeded item', async () => {
        const row = await itemRepo.findOne({ where: { name: FOOD_A } });
        if (!row) throw new Error('FOOD_A not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists item with nested size', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        const vendor = await vendorRepo.findOne({ where: { name: VENDOR_A } });
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        const unit = await measureRepo.findOne({ where: { name: POUND } });
        if (!category || !vendor || !pkg || !unit) {
            throw new Error('fixture row missing');
        }
        const dto = plainToInstance(CreateInventoryItemDto, {
            name: 'ControllerIntegrationItem',
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: 'c1',
                    packageId: pkg.id,
                    measureTypeId: unit.id,
                    measureAmount: 5,
                    cost: 10.99,
                }),
            ],
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await itemRepo.findOne({
            where: { name: 'ControllerIntegrationItem' },
            relations: ['sizes'],
        });
        expect(row?.sizes?.length).toEqual(1);
    });

    it('create throws ValidationException when name already exists', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        const vendor = await vendorRepo.findOne({ where: { name: VENDOR_A } });
        if (!category || !vendor) throw new Error('fixture missing');
        const dto = plainToInstance(CreateInventoryItemDto, {
            name: FOOD_A,
            categoryId: category.id,
            vendorId: vendor.id,
            sizes: [],
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
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides', async () => {
        const items = await itemRepo.find({ relations: ['category', 'vendor'] });
        if (items.length < 2) throw new Error('need 2 items');
        const itemToUpdate = items[0];
        const existingItem = items[1];
        if (!itemToUpdate.category || !itemToUpdate.vendor) {
            throw new Error('relations missing');
        }
        const dto = plainToInstance(UpdateInventoryItemDto, {
            name: existingItem.name,
            categoryId: itemToUpdate.category.id,
            vendorId: itemToUpdate.vendor.id,
            sizes: [],
        });
        try {
            await controller.update(itemToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update with non-existent id throws before persistence', async () => {
        const item = await itemRepo.findOne({
            where: { name: FOOD_A },
            relations: [
                'category',
                'vendor',
                'sizes',
                'sizes.package',
                'sizes.measureType',
            ],
        });
        if (!item?.category || !item.vendor) throw new Error('item relations');
        const dto = inventoryItemToUpdateDto(item);
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            ValidationException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryItemService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const item = await itemRepo.findOne({
                where: { name: FOOD_B },
                relations: [
                    'sizes',
                    'category',
                    'vendor',
                    'sizes.package',
                    'sizes.measureType',
                ],
            });
            if (!item?.sizes?.length) throw new Error('item sizes');
            const dto = inventoryItemToUpdateDto(item);
            const result = await controller.update(item.id, dto);
            expect(result.name).toEqual(item.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const item = await itemRepo.findOne({
                where: { name: DRY_A },
                relations: [
                    'sizes',
                    'category',
                    'vendor',
                    'sizes.package',
                    'sizes.measureType',
                ],
            });
            if (!item?.sizes?.length) throw new Error('item sizes');
            const dto = inventoryItemToUpdateDto(item, {
                name: 'Dry A Controller Renamed',
            });
            await controller.update(item.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await itemRepo.findOne({ where: { id: item.id } });
            expect(row?.name).toEqual('Dry A Controller Renamed');
        });
    });

    it('remove deletes created item then findOne fails', async () => {
        const category = await categoryRepo.findOne({ where: { name: FOOD_CAT } });
        const vendor = await vendorRepo.findOne({ where: { name: VENDOR_A } });
        const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
        const unit = await measureRepo.findOne({ where: { name: POUND } });
        if (!category || !vendor || !pkg || !unit) throw new Error('fixture');
        const created = await controller.create(
            plainToInstance(CreateInventoryItemDto, {
                name: 'ControllerRemoveMeItem',
                categoryId: category.id,
                vendorId: vendor.id,
                sizes: [
                    plainToInstance(NestedCreateInventoryItemSizeDto, {
                        createId: 'cRm',
                        packageId: pkg.id,
                        measureTypeId: unit.id,
                        measureAmount: 1,
                        cost: 1,
                    }),
                ],
            }),
        );
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
