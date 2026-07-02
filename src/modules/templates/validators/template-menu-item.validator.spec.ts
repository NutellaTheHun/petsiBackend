import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemValidator } from './template-menu-item.validator';

const P = `t${Date.now()}`;

describe('template menu item validator', () => {
    let testingUtil: TemplateTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: TemplateMenuItemValidator;
    let templateRepo: Repository<Template>;
    let templateItemRepo: Repository<TemplateMenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let itemRepo: Repository<MenuItem>;

    let templates: Template[];
    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let templateMenuItems: TemplateMenuItem[];

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule();
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        validator = module.get<TemplateMenuItemValidator>(TemplateMenuItemValidator);

        templateRepo = module.get(getRepositoryToken(Template));
        templateItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        itemRepo = module.get(getRepositoryToken(MenuItem));

        ({
            templates,
            categories,
            sizes,
            singleItems,
            fixedContainerItems,
            varContainerItems,
            templateMenuItems,
        } = await testingUtil.seedTemplateMenuItems(P));
    });

    afterAll(async () => {
        await templateItemRepo.delete(templateMenuItems.map((t) => t.id));
        await templateRepo.delete(templates.map((t) => t.id));
        const allItems = [...singleItems, ...fixedContainerItems, ...varContainerItems];
        await itemRepo.delete(allItems.map((i) => i.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
        await categoryRepo.delete(categories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateTemplateMenuItemDto = plainToInstance(CreateTemplateMenuItemDto, {
            displayName: `${P}-new-row`,
            tablePosIndex: 1,
            menuItemId: singleItems[0].id,
            parentTemplateId: templates[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: positional index cannot be less than 0', async () => {
        const dto: CreateTemplateMenuItemDto = plainToInstance(CreateTemplateMenuItemDto, {
            displayName: `${P}-new-row-bad-pos`,
            tablePosIndex: -1,
            menuItemId: singleItems[0].id,
            parentTemplateId: templates[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['tablePosIndex']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateTemplateMenuItemDto = plainToInstance(UpdateTemplateMenuItemDto, {
            tablePosIndex: 500,
            menuItemId: singleItems[1].id,
            displayName: `${P}-updated-row`,
        });

        const errors = await validator.validateDto(dto, templateMenuItems[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: positional index cannot be less than 0', async () => {
        const dto: UpdateTemplateMenuItemDto = plainToInstance(UpdateTemplateMenuItemDto, {
            tablePosIndex: -1,
            displayName: `${P}-updated-row-bad-pos`,
            menuItemId: templateMenuItems[0].menuItem.id,
        });

        const errors = await validator.validateDto(dto, templateMenuItems[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['tablePosIndex']),
        );
    });
});
