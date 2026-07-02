import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateValidator } from './template.validator';

const P = `t${Date.now()}`;

describe('template validator', () => {
    let testingUtil: TemplateTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: TemplateValidator;
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
        validator = module.get<TemplateValidator>(TemplateValidator);

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
        const dto: CreateTemplateDto = plainToInstance(CreateTemplateDto, {
            name: `${P}-new-template`,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: `${P}-item-2`,
                    menuItemId: singleItems[1].id,
                    tablePosIndex: 2,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateTemplateDto = plainToInstance(CreateTemplateDto, {
            name: templates[0].name,
            templateMenuItems: [],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: duplicate menu items on template menu items', async () => {
        const dto: CreateTemplateDto = plainToInstance(CreateTemplateDto, {
            name: `${P}-new-template-dup-item`,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: `${P}-item-2`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 2,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['templateMenuItems']),
        );
    });

    it('fail validate create: duplicate table position on template items', async () => {
        const dto: CreateTemplateDto = plainToInstance(CreateTemplateDto, {
            name: `${P}-new-template-dup-pos`,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: `${P}-item-2`,
                    menuItemId: singleItems[1].id,
                    tablePosIndex: 1,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['templateMenuItems']),
        );
    });

    it('fail validate create: nested template menu items validator errors: positional index cannot be less than 0', async () => {
        const dto: CreateTemplateDto = plainToInstance(CreateTemplateDto, {
            name: `${P}-new-template-bad-pos`,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: -1,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'templateMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['tablePosIndex']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const templateToUpdate = await templateRepo.findOneOrFail({
            where: { id: templates[0].id },
            relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
        });

        const dto: UpdateTemplateDto = plainToInstance(UpdateTemplateDto, {
            name: `${P}-updated-template`,
            templateMenuItems: [
                plainToInstance(NestedUpdateTemplateMenuItemDto, {
                    id: templateToUpdate.templateMenuItems[0].id,
                    tablePosIndex: 500,
                    displayName: `${P}-updated-item`,
                    menuItemId: templateToUpdate.templateMenuItems[0].menuItem.id,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-new-item`,
                    menuItemId: singleItems[2].id,
                    tablePosIndex: 501,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, templateToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateTemplateDto = plainToInstance(UpdateTemplateDto, {
            name: templates[1].name,
            templateMenuItems: [],
        });

        const errors = await validator.validateDto(dto, templates[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: duplicate menu items on template menu items', async () => {
        const dto: UpdateTemplateDto = plainToInstance(UpdateTemplateDto, {
            name: templates[0].name,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: `${P}-item-2`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 2,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, templates[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['templateMenuItems']),
        );
    });

    it('fail validate update: duplicate table position on template items', async () => {
        const dto: UpdateTemplateDto = plainToInstance(UpdateTemplateDto, {
            name: templates[0].name,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: `${P}-item-2`,
                    menuItemId: singleItems[1].id,
                    tablePosIndex: 1,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, templates[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['templateMenuItems']),
        );
    });

    it('fail validate update: nested template menu items validator errors: positional index cannot be less than 0', async () => {
        const dto: UpdateTemplateDto = plainToInstance(UpdateTemplateDto, {
            name: templates[0].name,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-item-1`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: -1,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, templates[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'templateMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['tablePosIndex']),
        );
    });
});
