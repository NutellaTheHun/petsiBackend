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
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { SIZE_ONE, SIZE_THREE, SIZE_TWO } from '../utils/constants';
import { menuItemSizeToUpdateDto } from '../utils/entity-transformers/menu-item-size.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemSizeController } from './menu-item-size.controller';

describe('menu item size controller', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: MenuItemSizeController;
    let sizeRepo: Repository<MenuItemSize>;

    beforeAll(async () => {
        module = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);

        controller = module.get<MenuItemSizeController>(MenuItemSizeController);
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await sizeRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await sizeRepo.find({ order: { name: 'DESC' } });
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

    it('findOne returns a seeded size', async () => {
        const size = await sizeRepo.findOne({ where: { name: SIZE_ONE } });
        if (!size) throw new Error('seed size not found');
        const result = await controller.findOne(size.id);
        expect(result.id).toEqual(size.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new size', async () => {
        const dto = plainToInstance(CreateMenuItemSizeDto, {
            name: 'controller-menu-item-size-new',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await sizeRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateMenuItemSizeDto, { name: SIZE_ONE });
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
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides with another size', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length < 2) throw new Error('Not enough sizes');

        const sizeToUpdate = sizes[0];
        const existingSize = sizes[1];
        const dto = plainToInstance(UpdateMenuItemSizeDto, {
            name: existingSize.name,
        });
        try {
            await controller.update(sizeToUpdate.id, dto);
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
        const dto = plainToInstance(UpdateMenuItemSizeDto, { name: 'DoesNotMatter' });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                MenuItemSizeService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current size', async () => {
            const size = await sizeRepo.findOne({ where: { name: SIZE_TWO } });
            if (!size) throw new Error('size two not found');
            const dto = menuItemSizeToUpdateDto(size);
            const result = await controller.update(size.id, dto);
            expect(result.name).toEqual(size.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const size = await sizeRepo.findOne({ where: { name: SIZE_THREE } });
            if (!size) throw new Error('size three not found');
            const newName = 'size 3 controller renamed';
            const dto = menuItemSizeToUpdateDto(size, { name: newName });
            const result = await controller.update(size.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await sizeRepo.findOne({ where: { id: size.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created size then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateMenuItemSizeDto, {
                name: 'controller-menu-item-size-remove',
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
