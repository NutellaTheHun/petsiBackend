import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { VENDOR_A } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorValidator } from './inventory-item-vendor.validator';

describe('inventory item vendor validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemVendorValidator;
  let vendorRepo: Repository<InventoryItemVendor>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    validator = module.get<InventoryItemVendorValidator>(
      InventoryItemVendorValidator,
    );
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);

    vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {
    const dto: CreateInventoryItemVendorDto = {
      name: 'New Vendor Name',
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: name already exists', async () => {
    const dto: CreateInventoryItemVendorDto = {
      name: VENDOR_A,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Vendor name already exists',
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const vendorToUpdate = await vendorRepo.findOne({
      where: { name: VENDOR_A },
    });
    if (!vendorToUpdate) {
      throw new Error('vendor not found');
    }

    const dto: UpdateInventoryItemVendorDto = {
      name: 'Updated Vendor Name',
    };

    const errors = await validator.validateUpdateNode(
      dto,
      vendorToUpdate.id,
    );
    expect(errors).toBeNull();
  });

  it('fail validate update: name already exists', async () => {
    const vendors = await vendorRepo.find();
    if (vendors.length < 2) {
      throw new Error('Not enough vendors for test');
    }

    const vendorToUpdate = vendors[0];
    const existingVendor = vendors[1];

    const dto: UpdateInventoryItemVendorDto = {
      name: existingVendor.name,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      vendorToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Vendor name already exists',
    );
  });
});
