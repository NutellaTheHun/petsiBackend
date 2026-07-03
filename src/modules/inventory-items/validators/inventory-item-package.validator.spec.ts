import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageValidator } from './inventory-item-package.validator';

const P = `t${Date.now()}`;

describe('inventory item package validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryItemPackageValidator;
    let packageRepo: Repository<InventoryItemPackage>;

    let packages: InventoryItemPackage[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        validator = module.get<InventoryItemPackageValidator>(InventoryItemPackageValidator);
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));

        ({ packages } = await testingUtil.seedPackages(P));
    });

    afterAll(async () => {
        await packageRepo.delete(packages.map((p) => p.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateInventoryItemPackageDto = plainToInstance(CreateInventoryItemPackageDto, {
            name: `${P}-new-pkg`,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryItemPackageDto = plainToInstance(CreateInventoryItemPackageDto, {
            name: packages[0].name,
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
        const dto: UpdateInventoryItemPackageDto = plainToInstance(UpdateInventoryItemPackageDto, {
            name: `${P}-updated-pkg`,
        });
        const errors = await validator.validateDto(dto, packages[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateInventoryItemPackageDto = plainToInstance(UpdateInventoryItemPackageDto, {
            name: packages[1].name,
        });
        const errors = await validator.validateDto(dto, packages[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
