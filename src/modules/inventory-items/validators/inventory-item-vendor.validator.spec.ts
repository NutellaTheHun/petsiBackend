import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorValidator } from './inventory-item-vendor.validator';

const P = `t${Date.now()}`;

describe('inventory item vendor validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryItemVendorValidator;
    let vendorRepo: Repository<InventoryItemVendor>;

    let vendors: InventoryItemVendor[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        validator = module.get<InventoryItemVendorValidator>(InventoryItemVendorValidator);
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));

        ({ vendors } = await testingUtil.seedVendors(P));
    });

    afterAll(async () => {
        await vendorRepo.delete(vendors.map((v) => v.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateInventoryItemVendorDto = plainToInstance(CreateInventoryItemVendorDto, {
            name: `${P}-new-vendor`,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryItemVendorDto = plainToInstance(CreateInventoryItemVendorDto, {
            name: vendors[0].name,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateInventoryItemVendorDto = plainToInstance(UpdateInventoryItemVendorDto, {
            name: `${P}-updated-vendor`,
        });
        const errors = await validator.validateDto(dto, vendors[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateInventoryItemVendorDto = plainToInstance(UpdateInventoryItemVendorDto, {
            name: vendors[1].name,
        });
        const errors = await validator.validateDto(dto, vendors[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
