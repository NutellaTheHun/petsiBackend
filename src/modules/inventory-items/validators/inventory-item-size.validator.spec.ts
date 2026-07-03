import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

const P = `t${Date.now()}`;

describe('inventory item size validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryItemSizeValidator;
    let sizeRepo: Repository<InventoryItemSize>;
    let itemRepo: Repository<InventoryItem>;
    let packageRepo: Repository<InventoryItemPackage>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;

    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        validator = module.get<InventoryItemSizeValidator>(InventoryItemSizeValidator);
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));

        ({ categories, vendors, packages, items, sizes } = await testingUtil.seedSizes(P));
    });

    afterAll(async () => {
        await sizeRepo.delete(sizes.map((s) => s.id));
        await itemRepo.delete(items.map((i) => i.id));
        await packageRepo.delete(packages.map((p) => p.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await vendorRepo.delete(vendors.map((v) => v.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateInventoryItemSizeDto = plainToInstance(CreateInventoryItemSizeDto, {
            inventoryItemId: items[0].id,
            packageId: packages[0].id,
            unit: 'lb',
            measureAmount: 500,
            cost: 10.99,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: measureAmount with value 0', async () => {
        const dto: CreateInventoryItemSizeDto = plainToInstance(CreateInventoryItemSizeDto, {
            inventoryItemId: items[0].id,
            packageId: packages[0].id,
            unit: 'lb',
            measureAmount: 0,
            cost: 10.99,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate create: cost with value 0', async () => {
        const dto: CreateInventoryItemSizeDto = plainToInstance(CreateInventoryItemSizeDto, {
            inventoryItemId: items[0].id,
            packageId: packages[0].id,
            unit: 'lb',
            measureAmount: 5,
            cost: -1,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    it('fail validate create: itemSize already exists for inventory item', async () => {
        const size0 = await sizeRepo.findOneOrFail({
            where: { id: sizes[0].id },
            relations: ['package'],
        });
        const dto: CreateInventoryItemSizeDto = plainToInstance(CreateInventoryItemSizeDto, {
            inventoryItemId: items[0].id,
            packageId: size0.package.id,
            unit: size0.unit,
            measureAmount: size0.measureAmount,
            cost: 10.99,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['unit', 'package', 'measureAmount']),
        );
    });

    it('successfully validate update: no validation errors', async () => {
        const size = await sizeRepo.findOneOrFail({
            where: { id: sizes[0].id },
            relations: ['package'],
        });
        const newPkg = packages.find((p) => p.id !== size.package.id);
        if (!newPkg) throw new Error('new package not found');
        const dto: UpdateInventoryItemSizeDto = plainToInstance(UpdateInventoryItemSizeDto, {
            packageId: newPkg.id,
            unit: 'oz',
            measureAmount: 10,
            cost: 15.99,
        });
        const errors = await validator.validateDto(dto, size.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: measureAmount with value 0', async () => {
        const size = await sizeRepo.findOneOrFail({
            where: { id: sizes[0].id },
            relations: ['package'],
        });
        const dto: UpdateInventoryItemSizeDto = plainToInstance(UpdateInventoryItemSizeDto, {
            measureAmount: 0,
            packageId: size.package.id,
            unit: size.unit,
            cost: null,
        });
        const errors = await validator.validateDto(dto, size.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['measureAmount']),
        );
    });

    it('fail validate update: cost with value 0', async () => {
        const size = await sizeRepo.findOneOrFail({
            where: { id: sizes[0].id },
            relations: ['package'],
        });
        const dto: UpdateInventoryItemSizeDto = plainToInstance(UpdateInventoryItemSizeDto, {
            cost: -1,
            packageId: size.package.id,
            unit: size.unit,
            measureAmount: 1,
        });
        const errors = await validator.validateDto(dto, size.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['cost']),
        );
    });

    it('fail validate update: itemSize already exists for inventory item', async () => {
        // sizes[0] and sizes[1] both belong to items[0]
        const size1 = await sizeRepo.findOneOrFail({
            where: { id: sizes[0].id },
            relations: ['package'],
        });
        const size2 = await sizeRepo.findOneOrFail({
            where: { id: sizes[1].id },
            relations: ['package'],
        });
        const dto: UpdateInventoryItemSizeDto = plainToInstance(UpdateInventoryItemSizeDto, {
            packageId: size2.package.id,
            unit: size2.unit,
            measureAmount: size2.measureAmount,
            cost: null,
        });
        const errors = await validator.validateDto(dto, size1.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['unit', 'package', 'measureAmount']),
        );
    });
});
