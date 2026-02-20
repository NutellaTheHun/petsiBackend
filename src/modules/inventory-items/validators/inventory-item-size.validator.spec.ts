import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { FOOD_A, PACKAGE_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

describe('inventory item size validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemSizeValidator;
    let sizeRepo: Repository<InventoryItemSize>;
    let itemRepo: Repository<InventoryItem>;
    let unitRepo: Repository<UnitOfMeasure>;
    let packageRepo: Repository<InventoryItemPackage>;

    const findInventoryItem = async (name: string) => {
        return await itemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'sizes.package', 'sizes.measureType'] });
    }

    const findInventoryItemSize = async () => {
        return await sizeRepo.findOneOrFail({ relations: ['inventoryItem', 'package', 'measureType'] });
    }

    const findUnitOfMeasure = async (name: string) => {
        return await unitRepo.findOneOrFail({ where: { name } });
    }

    const findInventoryItemPackage = async (name: string) => {
        return await packageRepo.findOneOrFail({ where: { name } });
    }

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

        validator = module.get<InventoryItemSizeValidator>(
            InventoryItemSizeValidator,
        );

        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const item = await findInventoryItem(FOOD_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateInventoryItemSizeDto = {
            inventoryItemId: item.id,
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 5,
            cost: 10.99,
        };

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: measureAmount with value 0', async () => {
        const item = await findInventoryItem(FOOD_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateInventoryItemSizeDto = {
            inventoryItemId: item.id,
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 0,
            cost: 10.99,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate create: cost with value 0', async () => {
        const item = await findInventoryItem(FOOD_A);
        const pkg = await findInventoryItemPackage(PACKAGE_PKG);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateInventoryItemSizeDto = {
            inventoryItemId: item.id,
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 5,
            cost: -1,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });

    it('fail validate create: itemSize already exists for inventory item.', async () => {
        const item = await findInventoryItem(FOOD_A);
        const existingSize = item.sizes[0];

        const dto: CreateInventoryItemSizeDto = {
            inventoryItemId: item.id,
            packageId: existingSize.package.id,
            measureTypeId: existingSize.measureType.id,
            measureAmount: 5,
            cost: 10.99,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['measureType', 'package', 'measureAmount']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const sizeToUpdate = await findInventoryItemSize();

        const pkgs = await packageRepo.find();
        const newPkg = pkgs.find((pkg) => pkg.id !== sizeToUpdate.package.id);
        if (!newPkg) {
            throw new Error('new package not found');
        }

        const uoms = await unitRepo.find();
        const newUom = uoms.find((uom) => uom.id !== sizeToUpdate.measureType.id);
        if (!newUom) {
            throw new Error('new uom not found');
        }

        const dto: UpdateInventoryItemSizeDto = {
            packageId: newPkg.id,
            measureTypeId: newUom.id,
            measureAmount: 10,
            cost: 15.99,
        };

        const errors = await validator.validateDto(dto, sizeToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: measureAmount with value 0', async () => {
        const sizeToUpdate = await findInventoryItemSize();

        const dto: UpdateInventoryItemSizeDto = {
            measureAmount: 0,
            packageId: sizeToUpdate.package.id,
            measureTypeId: sizeToUpdate.measureType.id,
            cost: null,
        };

        const errors = await validator.validateDto(dto, sizeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['measureAmount']),
        );
    });

    it('fail validate update: cost with value 0', async () => {
        const sizeToUpdate = await findInventoryItemSize();

        const dto: UpdateInventoryItemSizeDto = {
            cost: -1,
            packageId: sizeToUpdate.package.id,
            measureTypeId: sizeToUpdate.measureType.id,
            measureAmount: 1,
        };

        const errors = await validator.validateDto(dto, sizeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['cost']),
        );
    });

    it('fail validate update: itemSize already exists for inventory item.', async () => {
        const sizes = await sizeRepo.find({
            relations: ['inventoryItem', 'package', 'measureType'],
        });
        if (sizes.length < 2) {
            throw new Error('Not enough sizes for test');
        }

        // Find two sizes with the same inventory item
        const size1 = sizes[0];
        const size2 = sizes.find(
            (s) => s.inventoryItem.id === size1.inventoryItem.id && s.id !== size1.id,
        );

        if (!size2) {
            throw new Error('Could not find two sizes for same item');
        }

        // Try to update size1 to match size2's package/measureType combination
        const dto: UpdateInventoryItemSizeDto = {
            packageId: size2.package.id,
            measureTypeId: size2.measureType.id,
            measureAmount: size2.measureAmount,
            cost: null,
        };

        const errors = await validator.validateDto(dto, size1.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['measureType', 'package', 'measureAmount']),
        );
    });
});
