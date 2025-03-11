import { TestingModule } from '@nestjs/testing';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';

describe('Inventory Item Vendor Service', () => {
  let service: InventoryItemVendorService;
  let factory: InventoryItemVendorFactory;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    service = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    factory = module.get<InventoryItemVendorFactory>(InventoryItemVendorFactory);
  });

  afterAll(async () => {
    const queryBuilder = service.getQueryBuilder();
    await queryBuilder.delete().execute();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a vendor', async () => {
    const vendorDto = await factory.createDtoInstance({ name: "testVendorName" });

    const result = await service.create(vendorDto);

    // for future testing
    testId = result?.id as number;

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should update a vendor', async () => {
    const toUpdate = await service.findOne(testId);
    if(!toUpdate) { throw new Error('vendor to update is null.'); }

    toUpdate.name = "UPDATE_NAME";
    const result = await service.update(testId, 
      factory.createDtoInstance({
        name: toUpdate.name,
      })
    );

    expect(result?.name).toEqual("UPDATE_NAME");
  });

  it('should remove a vendor', async () => {
    const removal = await service.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await service.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should get all vendors', async () => {
    const vendors = factory.getTestingVendors();
    if(!vendors){ throw new Error('testing vendors list is null'); }
    expect(vendors.length).toBeGreaterThan(0);

    for(const vendor of vendors){
      await service.create(
        factory.createDtoInstance({ name: vendor.name })
      )
    }

    const results = await service.findAll();
    expect(results.length).toEqual(vendors.length);

    // for future test
    testIds = [results[0].id, results[1].id, results[2].id]
  });

  it('should get a vendor by name', async () => {
    const result = await service.findOneByName("vendorA");
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("vendorA");
  });

  it('should get vendor from a list of ids', async () => {
    const results = await service.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
  });
});