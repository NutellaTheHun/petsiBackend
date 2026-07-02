import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { templateToUpdateDto } from '../utils/entity-transformers/template.dto.transformer';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateService } from './template.service';

class TestableTemplateService extends TemplateService {
    async createEntityForTest(
        dto: CreateTemplateDto,
        manager: EntityManager,
    ): Promise<Template> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateTemplateDto,
        entity: Template,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Template Service', () => {
    let testingUtil: TemplateTestingUtil;
    let templateService: TestableTemplateService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

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
        const module: TestingModule = await getTemplateTestingModule({
            templateServiceClass: TestableTemplateService,
        });
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        templateService = module.get(TemplateService) as TestableTemplateService;
        dataSource = module.get(DataSource);

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

    describe('template lifecycle', () => {
        let template: Template;

        it('should create template', async () => {
            const dto = plainToInstance(CreateTemplateDto, {
                name: `${P}-lifecycle-template`,
            });
            await dataSource.transaction(async (manager) => {
                template = await templateService.createEntityForTest(dto, manager);
            });
            expect(template.id).toBeDefined();
            expect(template.name).toBe(dto.name);
        });

        it('should update template', async () => {
            const dto = plainToInstance(UpdateTemplateDto, {
                name: `${P}-lifecycle-template-updated`,
            });
            await dataSource.transaction(async (manager) => {
                await templateService.updateEntityForTest(dto, template, manager);
            });
            const reloaded = await templateRepo.findOneOrFail({ where: { id: template.id } });
            expect(reloaded.name).toBe(`${P}-lifecycle-template-updated`);
        });

        it('should remove template', async () => {
            await templateService.remove(template.id);
            await expect(templateService.findOne(template.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should create template with nested menu items', async () => {
        const dto = plainToInstance(CreateTemplateDto, {
            name: `${P}-with-items`,
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c1',
                    displayName: `${P}-row-a`,
                    menuItemId: singleItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c2',
                    displayName: `${P}-row-b`,
                    menuItemId: singleItems[1].id,
                    tablePosIndex: 2,
                }),
            ],
        });

        let created: Template;
        await dataSource.transaction(async (manager) => {
            created = await templateService.createEntityForTest(dto, manager);
        });
        testCtx.addCleanupFunction(async () => {
            await templateItemRepo.delete({ parentTemplate: { id: created.id } });
            await templateRepo.delete(created.id);
        });

        expect(created!.id).toBeDefined();
        expect(created!.templateMenuItems.length).toBe(2);
        expect(created!.templateMenuItems[0].displayName).toBe(
            dto.templateMenuItems[0].displayName,
        );
    });

    it('removes template menu items via authoritative parent update', async () => {
        const toUpdate = await templateRepo.findOneOrFail({
            where: { id: templates[0].id },
            relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
        });
        expect(toUpdate.templateMenuItems.length).toBeGreaterThan(0);

        const dto = plainToInstance(UpdateTemplateDto, {
            name: toUpdate.name,
            templateMenuItems: [],
        });

        await dataSource.transaction(async (manager) => {
            await templateService.updateEntityForTest(dto, toUpdate, manager);
        });

        const reloaded = await templateRepo.findOneOrFail({
            where: { id: toUpdate.id },
            relations: ['templateMenuItems'],
        });
        expect(reloaded.templateMenuItems.length).toBe(0);
    });

    it('should find seeded template in findAll results', async () => {
        const result = await templateService.findAll({ limit: 100 });
        const found = result.items.find((t) => t.id === templates[1].id);
        expect(found).toBeDefined();
    });

    it('should find one template with relations', async () => {
        const result = await templateService.findOne(templates[2].id, [
            'templateMenuItems',
        ]);
        expect(result.id).toBe(templates[2].id);
        expect(Array.isArray(result.templateMenuItems)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(templateService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(TemplateService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const entity = await templateRepo.findOneOrFail({
                where: { id: templates[3].id },
                relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
            });
            const dto = templateToUpdateDto(entity);
            const result = await templateService.update(entity.id, dto);
            expect(result.name).toBe(entity.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const entity = await templateRepo.findOneOrFail({
                where: { id: templates[3].id },
                relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
            });
            const dto = templateToUpdateDto(entity, { name: `${P}-renamed` });
            await templateService.update(entity.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await templateRepo.findOneOrFail({ where: { id: entity.id } });
            expect(row.name).toBe(`${P}-renamed`);
        });
    });
});
