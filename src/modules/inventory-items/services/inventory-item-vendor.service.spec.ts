import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';
import { VENDOR_A } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { NotFoundException } from '@nestjs/common';

describe('Inventory Item Vendor Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let vendorService: InventoryItemVendorService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);

    vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(vendorService).toBeDefined();
  });

  it('should create a vendor', async () => {
    const dto = { 
      name: "testVendorName" 
    } as CreateInventoryItemVendorDto;
    const result = await vendorService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    testId = result?.id as number;
  });

  it('should update a vendor name', async () => {
    const dto = {
      name: "UPDATE_NAME",
    } as UpdateInventoryItemVendorDto;
    const result = await vendorService.update( testId, dto);

    expect(result?.name).toEqual("UPDATE_NAME");
  });

  it('should remove a vendor', async () => {
    const removal = await vendorService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(vendorService.findOne(testId)).rejects.toThrow(NotFoundException);
  });

  it('should get all vendors', async () => {
    const vendors = await testingUtil.getTestInventoryItemVendorEntities(dbTestContext);
    const results = await vendorService.findAll();

    expect(results.items.length).toEqual(vendors.length);
    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  it('should get a vendor by name', async () => {
    const result = await vendorService.findOneByName(VENDOR_A);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(VENDOR_A);
  });

  it('should get vendor from a list of ids', async () => {
    const results = await vendorService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
  });
});