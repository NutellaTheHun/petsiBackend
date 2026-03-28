import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { BAG_PKG, BOX_PKG, CAN_PKG, PACKAGE_PKG } from '../utils/constants';
import { inventoryItemPackageToUpdateDto } from '../utils/entity-transformers/inventory-item-package.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageService } from '../services/inventory-item-package.service';
import { InventoryItemPackageController } from './inventory-item-package.controller';

describe('Inventory Item Package Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryItemPackageController;
    let packageRepo: Repository<InventoryItemPackage>;

    beforeAll(async () => {
        module = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);

        controller = module.get<InventoryItemPackageController>(
            InventoryItemPackageController,
        );
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns packages aligned with repository', async () => {
        const repoRows = await packageRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sort by name DESC', async () => {
        const repoResult = await packageRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            undefined,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns seeded package', async () => {
        const row = await packageRepo.findOne({ where: { name: BOX_PKG } });
        if (!row) throw new Error('package not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists package', async () => {
        const dto = plainToInstance(CreateInventoryItemPackageDto, {
            name: 'ControllerPackageX',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryItemPackageDto, {
            name: PACKAGE_PKG,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides', async () => {
        const pkgs = await packageRepo.find();
        if (pkgs.length < 2) throw new Error('need 2 packages');
        const dto = plainToInstance(UpdateInventoryItemPackageDto, {
            name: pkgs[1].name,
        });
        try {
            await controller.update(pkgs[0].id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateInventoryItemPackageDto, {
            name: 'Nope',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(
                InventoryItemPackageService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const pkg = await packageRepo.findOne({ where: { name: BAG_PKG } });
            if (!pkg) throw new Error('pkg');
            const dto = inventoryItemPackageToUpdateDto(pkg);
            await controller.update(pkg.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const pkg = await packageRepo.findOne({ where: { name: CAN_PKG } });
            if (!pkg) throw new Error('pkg');
            const dto = inventoryItemPackageToUpdateDto(pkg, {
                name: 'Can Pkg Ctrl Renamed',
            });
            await controller.update(pkg.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await packageRepo.findOne({ where: { id: pkg.id } });
            expect(row?.name).toEqual('Can Pkg Ctrl Renamed');
        });
    });

    it('remove deletes created package then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateInventoryItemPackageDto, {
                name: 'ControllerRemovePkg',
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
