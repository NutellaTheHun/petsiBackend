import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateInventoryItemVendorDto } from "../dto/inventory-item-vendor/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/inventory-item-vendor/update-inventory-item-vendor.dto";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { VENDOR_A, VENDOR_B } from "../utils/constants";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemTestingUtil } from "../utils/inventory-item-testing.util";
import { InventoryItemVendorValidator } from "./inventory-item-vendor.validator";

describe('inventory item vendor validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemVendorValidator;
    let service: InventoryItemVendorService;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        validator = module.get<InventoryItemVendorValidator>(InventoryItemVendorValidator);
        service = module.get<InventoryItemVendorService>(InventoryItemVendorService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        await testingUtil.initInventoryItemVendorTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const dto = {
            vendorName: "TEST CREATE"
        } as CreateInventoryItemVendorDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            vendorName: VENDOR_B
        } as CreateInventoryItemVendorDto;

        const result = await validator.validateCreate(dto);
        expect(result).toEqual(`Inventory item vendor with name ${VENDOR_B} already exists`);
    });

    it('should validate update', async () => {
        const toUpdate = await service.findOneByName(VENDOR_A);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            vendorName: "TEST UPDATE"
        } as UpdateInventoryItemVendorDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);

        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(VENDOR_A);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            vendorName: VENDOR_A,
        } as UpdateInventoryItemVendorDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Inventory item vendor with name ${VENDOR_A} already exists`);
    });

});