import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemValidator } from './template-menu-item.validator';

describe('template menu item validator', () => {
    let testingUtil: TemplateTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: TemplateMenuItemValidator;
    let templateMenuItemRepo: Repository<TemplateMenuItem>;
    let templateRepo: Repository<Template>;
    let menuItemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

        validator = module.get<TemplateMenuItemValidator>(
            TemplateMenuItemValidator,
        );

        templateMenuItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
        templateRepo = module.get(getRepositoryToken(Template));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const template = await templateRepo.findOne({});
        if (!template) {
            throw new Error('template not found');
        }
        const menuItem = await menuItemRepo.findOne({});
        if (!menuItem) {
            throw new Error('menu item not found');
        }

        const dto: CreateTemplateMenuItemDto = {
            displayName: 'Display Name',
            tablePosIndex: 0,
            menuItemId: menuItem.id,
            parentTemplateId: template.id,
        };

        const errors = await validator.validateDto(dto, 'root')
        expect(errors).toBeNull();
    });

    it('fail validate create: positional index cannot be less than 0', async () => {
        const template = await templateRepo.findOne({});
        if (!template) {
            throw new Error('template not found');
        }
        const menuItem = await menuItemRepo.findOne({});
        if (!menuItem) {
            throw new Error('menu item not found');
        }

        const dto: CreateTemplateMenuItemDto = {
            displayName: 'Display Name',
            tablePosIndex: -1,
            menuItemId: menuItem.id,
            parentTemplateId: template.id,
        };

        const errors = await validator.validateDto(dto, 'root')
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['tablePosIndex']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const templateMenuItemToUpdate = await templateMenuItemRepo.findOne({});
        if (!templateMenuItemToUpdate) {
            throw new Error('template menu item not found');
        }
        const newMenuItem = await menuItemRepo.findOne({});
        if (!newMenuItem) {
            throw new Error('new menu item not found');
        }

        const dto: UpdateTemplateMenuItemDto = {
            tablePosIndex: 5,
            menuItemId: newMenuItem.id,
            displayName: 'Updated Display Name',
        };

        const errors = await validator.validateDto(
            dto,
            templateMenuItemToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: positional index cannot be less than 0', async () => {
        const templateMenuItemToUpdate = await templateMenuItemRepo.findOne({ relations: ['menuItem'] });
        if (!templateMenuItemToUpdate) {
            throw new Error('template menu item not found');
        }

        const dto: UpdateTemplateMenuItemDto = {
            tablePosIndex: -1,
            displayName: 'Updated Display Name',
            menuItemId: templateMenuItemToUpdate.menuItem.id,
        };

        const errors = await validator.validateDto(
            dto,
            templateMenuItemToUpdate.id,
        );
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', [], ['tablePosIndex']),
        );
    });
});
