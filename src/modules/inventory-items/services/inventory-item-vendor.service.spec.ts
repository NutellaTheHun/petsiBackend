import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { InventoryItemService } from './inventory-item.service';
import { DRY_A, FOOD_A, OTHER_A } from '../utils/constants';

describe('Inventory Item Vendor Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let vendorService: InventoryItemVendorService;
  let itemService: InventoryItemService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);
    await testingUtil.initInventoryItemTestDatabase(dbTestContext);

    vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    itemService = module.get<InventoryItemService>(InventoryItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(vendorService).toBeDefined();
  });

  it('should create a vendor', async () => {
    const vendorDto ={ name: "testVendorName" } as CreateInventoryItemVendorDto;

    const result = await vendorService.create(vendorDto);

    // for future testing
    testId = result?.id as number;

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should update a vendor', async () => {
    const toUpdate = await vendorService.findOne(testId);
    if(!toUpdate) { throw new Error('vendor to update is null.'); }
    
    const item_A = await itemService.findOneByName(FOOD_A);
    const item_B = await itemService.findOneByName(DRY_A);
    const item_C = await itemService.findOneByName(OTHER_A);

    toUpdate.name = "UPDATE_NAME";
    const result = await vendorService.update(
      testId, 
      { 
        name: toUpdate.name,
        inventoryItemIds: [item_A?.id, item_B?.id, item_C?.id ]
      } as UpdateInventoryItemVendorDto
    );

    expect(result?.name).toEqual("UPDATE_NAME");
  });

  it('should remove a vendor', async () => {
    const removal = await vendorService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await vendorService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should get all vendors', async () => {
    const vendors = await testingUtil.getTestInventoryItemVendorEntities(dbTestContext);

    for(const vendor of vendors){
      await vendorService.create({ name: vendor.name } as CreateInventoryItemVendorDto );
    }

    const results = await vendorService.findAll();
    expect(results.length).toEqual(vendors.length);

    // for future test
    testIds = [results[0].id, results[1].id, results[2].id];
  });

  it('should get a vendor by name', async () => {
    const result = await vendorService.findOneByName("vendorA");
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("vendorA");
  });

  it('should get vendor from a list of ids', async () => {
    const results = await vendorService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
  });
});