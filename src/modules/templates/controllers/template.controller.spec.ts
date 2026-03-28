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
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';
import {
    template_a,
    template_b,
    template_c,
    template_d,
} from '../utils/constants';
import { templateToUpdateDto } from '../utils/entity-transformers/template.dto.transformer';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateController } from './template.controller';

describe('TemplateController', () => {
    let module: TestingModule;
    let dbTestContext: DatabaseTestContext;
    let testingUtil: TemplateTestingUtil;
    let controller: TemplateController;
    let templateRepo: Repository<Template>;
    let menuItemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        module = await getTemplateTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get(TemplateTestingUtil);
        await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

        controller = module.get(TemplateController);
        templateRepo = module.get(getRepositoryToken(Template));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await templateRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with relations and sortBy name DESC orders like the service', async () => {
        const result = await controller.findAll(
            ['templateMenuItems'],
            100,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items[0].name).toEqual(template_d);
    });

    it('findOne returns a seeded template', async () => {
        const row = await templateRepo.findOne({ where: { name: template_a } });
        if (!row) throw new Error('seed template not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
        expect(result.name).toEqual(template_a);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a template with nested menu items', async () => {
        const menuItems = await menuItemRepo.find({ take: 1 });
        if (!menuItems.length) throw new Error('menu items not found');
        const dto = plainToInstance(CreateTemplateDto, {
            name: 'ControllerTemplateCreate',
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: 'CtrlItem',
                    menuItemId: menuItems[0].id,
                    tablePosIndex: 1,
                }),
            ],
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const persisted = await templateRepo.findOne({
            where: { name: 'ControllerTemplateCreate' },
            relations: ['templateMenuItems'],
        });
        expect(persisted).not.toBeNull();
        expect(persisted!.templateMenuItems.length).toEqual(1);
    });

    it('create throws ValidationException when name already exists', async () => {
        const menuItems = await menuItemRepo.find({ take: 1 });
        if (!menuItems.length) throw new Error('menu items not found');
        const dto = plainToInstance(CreateTemplateDto, {
            name: template_a,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'cx',
                    displayName: 'X',
                    menuItemId: menuItems[0].id,
                    tablePosIndex: 9,
                }),
            ],
        });
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

    it('create throws ValidationException on duplicate menuItemId in nested items', async () => {
        const menuItem = await menuItemRepo.findOne({ where: {} });
        if (!menuItem) throw new Error('menu item not found');
        const dto = plainToInstance(CreateTemplateDto, {
            name: 'ControllerDupMenuTpl',
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: 'Item 1',
                    menuItemId: menuItem.id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: 'Item 2',
                    menuItemId: menuItem.id,
                    tablePosIndex: 2,
                }),
            ],
        });
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
                createValidationErrorPayload(
                    'DUPLICATE_ITEMS',
                    ['c1', 'c2'],
                    ['templateMenuItems'],
                ),
            );
        }
    });

    it('update throws ValidationException when name collides with another template', async () => {
        const toUpdate = await templateRepo.findOne({
            where: { name: template_a },
            relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
        });
        if (!toUpdate?.templateMenuItems?.length) {
            throw new Error('template_a with menu items not found');
        }
        const dto = templateToUpdateDto(toUpdate, { name: template_b });
        try {
            await controller.update(toUpdate.id, dto);
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

    it('update surfaces missing entity via DatabaseException', async () => {
        const toUpdate = await templateRepo.findOne({
            where: { name: template_a },
            relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
        });
        if (!toUpdate?.templateMenuItems?.length) {
            throw new Error('template_a with menu items not found');
        }
        const dto = templateToUpdateDto(toUpdate, {
            name: 'ControllerMissingIdName',
        });
        await expect(
            controller.update(9_999_999, dto),
        ).rejects.toThrow(DatabaseException);
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                TemplateService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current entity', async () => {
            const entity = await templateRepo.findOne({
                where: { name: template_a },
                relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
            });
            if (!entity) throw new Error('template not found');
            const dto = templateToUpdateDto(entity);
            const result = await controller.update(entity.id, dto);
            expect(result.name).toEqual(entity.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const entity = await templateRepo.findOne({
                where: { name: template_c },
                relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
            });
            if (!entity?.templateMenuItems?.length) {
                throw new Error('template_c with menu items not found');
            }
            const newName = 'Template C Controller Renamed';
            const dto = templateToUpdateDto(entity, { name: newName });
            const result = await controller.update(entity.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await templateRepo.findOne({ where: { id: entity.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a template then findOne fails', async () => {
        const menuItems = await menuItemRepo.find({ take: 1 });
        if (!menuItems.length) throw new Error('menu items not found');
        const dto = plainToInstance(CreateTemplateDto, {
            name: 'ControllerTemplateRemoveMe',
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'cr',
                    displayName: 'R',
                    menuItemId: menuItems[0].id,
                    tablePosIndex: 1,
                }),
            ],
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
