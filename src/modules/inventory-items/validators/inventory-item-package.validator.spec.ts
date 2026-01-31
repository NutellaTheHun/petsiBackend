import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { PACKAGE_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageValidator } from './inventory-item-package.validator';

describe('inventory item package validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemPackageValidator;

    let packageRepo: Repository<InventoryItemPackage>;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);

        validator = module.get<InventoryItemPackageValidator>(
            InventoryItemPackageValidator,
        );

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
        const dto: CreateInventoryItemPackageDto = {
            name: 'New Package Name',
        };

        const errors = await validator.validateCreateNode(dto);
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryItemPackageDto = {
            name: PACKAGE_PKG,
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Package name already exists',
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const packageToUpdate = await packageRepo.findOne({
            where: { name: PACKAGE_PKG },
        });
        if (!packageToUpdate) {
            throw new Error('package not found');
        }

        const dto: UpdateInventoryItemPackageDto = {
            name: 'Updated Package Name',
        };

        const errors = await validator.validateUpdateNode(
            dto,
            packageToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const packages = await packageRepo.find();
        if (packages.length < 2) {
            throw new Error('Not enough packages for test');
        }

        const packageToUpdate = packages[0];
        const existingPackage = packages[1];

        const dto: UpdateInventoryItemPackageDto = {
            name: existingPackage.name,
        };

        const errors = await validator.validateUpdateNode(
            dto,
            packageToUpdate.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Package name already exists',
        );
    });
});
