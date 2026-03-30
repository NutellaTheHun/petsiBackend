import { NotFoundException } from '@nestjs/common';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaService } from '../services/inventory-area.service';
import { AREA_A, AREA_B, AREA_C, AREA_D } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaController } from './inventory-area.controller';

describe('inventory area controller', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: InventoryAreaController;
    let areaRepo: Repository<InventoryArea>;

    beforeAll(async () => {
        module = await getInventoryAreasTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaTestDatabase(dbTestContext);

        controller = module.get<InventoryAreaController>(InventoryAreaController);
        areaRepo = module.get(getRepositoryToken(InventoryArea));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await areaRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findOne returns a seeded area', async () => {
        const area = await areaRepo.findOne({ where: { name: AREA_A } });
        if (!area) throw new Error('seed area not found');
        const result = await controller.findOne(area.id);
        expect(result.id).toEqual(area.id);
        expect(result.name).toEqual(AREA_A);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new area', async () => {
        const dto = plainToInstance(CreateInventoryAreaDto, {
            name: 'ControllerIntegrationArea',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await areaRepo.findOne({
            where: { name: 'ControllerIntegrationArea' },
        });
        expect(row).not.toBeNull();
        expect(row!.name).toEqual('ControllerIntegrationArea');
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryAreaDto, { name: AREA_A });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('update throws ValidationException when name collides with another area', async () => {
        const areaA = await areaRepo.findOne({ where: { name: AREA_A } });
        if (!areaA) throw new Error('area A not found');
        const dto = plainToInstance(UpdateInventoryAreaDto, { name: AREA_B });
        try {
            await controller.update(areaA.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException (findOne wrapped by handler)', async () => {
        const dto = plainToInstance(UpdateInventoryAreaDto, {
            name: 'DoesNotMatter',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                InventoryAreaService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current name', async () => {
            const area = await areaRepo.findOne({ where: { name: AREA_D } });
            if (!area) throw new Error('area D not found');
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: AREA_D,
            });
            const result = await controller.update(area.id, dto);
            expect(result.name).toEqual(AREA_D);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const area = await areaRepo.findOne({ where: { name: AREA_C } });
            if (!area) throw new Error('area C not found');
            const newName = 'Area C Controller Renamed';
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: newName,
            });
            const result = await controller.update(area.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await areaRepo.findOne({ where: { id: area.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes an area then findOne fails', async () => {
        const dto = plainToInstance(CreateInventoryAreaDto, {
            name: 'ControllerRemoveMeArea',
        });
        const created = await controller.create(dto);
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
