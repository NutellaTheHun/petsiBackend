import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { VENDOR_A, VENDOR_B, VENDOR_C } from '../utils/constants';
import { inventoryItemVendorToUpdateDto } from '../utils/entity-transformers/inventory-item-vendor.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { InventoryItemVendorController } from './inventory-item-vendor.controller';

describe('Inventory Item Vendor Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryItemVendorController;
    let vendorRepo: Repository<InventoryItemVendor>;

    beforeAll(async () => {
        module = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);

        controller = module.get<InventoryItemVendorController>(
            InventoryItemVendorController,
        );
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns vendors aligned with repository', async () => {
        const repoRows = await vendorRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sort by name DESC', async () => {
        const repoResult = await vendorRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            undefined,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns seeded vendor', async () => {
        const row = await vendorRepo.findOne({ where: { name: VENDOR_A } });
        if (!row) throw new Error('vendor not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists vendor', async () => {
        const dto = plainToInstance(CreateInventoryItemVendorDto, {
            name: 'ControllerVendorX',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryItemVendorDto, {
            name: VENDOR_A,
        });
        try {
            await controller.create(dto);
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

    it('update throws ValidationException when name collides', async () => {
        const vendors = await vendorRepo.find();
        if (vendors.length < 2) throw new Error('need 2 vendors');
        const dto = plainToInstance(UpdateInventoryItemVendorDto, {
            name: vendors[1].name,
        });
        try {
            await controller.update(vendors[0].id, dto);
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

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateInventoryItemVendorDto, {
            name: 'Nope',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(
                InventoryItemVendorService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const v = await vendorRepo.findOne({ where: { name: VENDOR_B } });
            if (!v) throw new Error('vendor');
            const dto = inventoryItemVendorToUpdateDto(v);
            await controller.update(v.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const v = await vendorRepo.findOne({ where: { name: VENDOR_C } });
            if (!v) throw new Error('vendor');
            const dto = inventoryItemVendorToUpdateDto(v, {
                name: 'Vendor C Ctrl Renamed',
            });
            await controller.update(v.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await vendorRepo.findOne({ where: { id: v.id } });
            expect(row?.name).toEqual('Vendor C Ctrl Renamed');
        });
    });

    it('remove deletes created vendor then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateInventoryItemVendorDto, {
                name: 'ControllerRemoveVendor',
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
