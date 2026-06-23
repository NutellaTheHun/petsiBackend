import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { template_a } from '../utils/constants';
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

describe('Template Service', () => {
    let templateService: TestableTemplateService;
    let testingUtil: TemplateTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let templateRepo: Repository<Template>;
    let templateItemRepo: Repository<TemplateMenuItem>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemTestUtil: MenuItemTestingUtil;

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule({
            templateServiceClass: TestableTemplateService,
        });
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        await testingUtil.initTemplateTestDatabase(dbTestContext);

        templateService = module.get(TemplateService) as TestableTemplateService;
        dataSource = module.get(DataSource);
        templateRepo = module.get(getRepositoryToken(Template));
        templateItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(templateService).toBeDefined();
    });

    // test createEntity()
    it('should create template', async () => {
        const dto = plainToInstance(CreateTemplateDto, { name: 'Test Template' });

        await dataSource.transaction(async (manager) => {
            const result = await templateService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.name).toEqual(dto.name);
        });
    });

    // TODO: test createEntity() with NestedCreateTemplateMenuItemDtos
    it('should create template with NestedCreateTemplateMenuItemDtos', async () => {
        const menuItems = await menuItemRepo.find({ take: 2 });
        if (!menuItems.length) throw new Error('menu items not found');
        const dto = plainToInstance(CreateTemplateDto, {
            name: 'Test Template w items',
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, { createId: 'c1', displayName: 'CLAPPLE', menuItemId: menuItems[0].id, tablePosIndex: 1 }),
                plainToInstance(NestedCreateTemplateMenuItemDto, { createId: 'c2', displayName: 'MIX', menuItemId: menuItems[1].id, tablePosIndex: 2 }),
            ]
        });

        await dataSource.transaction(async (manager) => {
            const result = await templateService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.name).toEqual(dto.name);
            expect(result.templateMenuItems.length).toEqual(dto.templateMenuItems.length);
            expect(result.templateMenuItems[0].displayName).toEqual(dto.templateMenuItems[0].displayName);
            expect(result.templateMenuItems[1].displayName).toEqual(dto.templateMenuItems[1].displayName);
        });
    });

    // test updateEntity()
    it('should update template', async () => {
        const newName = 'Template A Updated';
        const toUpdate = await templateRepo.findOne({ where: { name: template_a }, relations: ['templateMenuItems', 'templateMenuItems.menuItem'] });
        if (!toUpdate) throw new Error('template not found');

        const menuItems = await menuItemRepo.find({ take: 1 });
        if (!menuItems.length) throw new Error('menu items not found');

        const dto = templateToUpdateDto(toUpdate, {
            name: newName, templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, { createId: 'c1', displayName: 'CLAPPLE', menuItemId: menuItems[0].id, tablePosIndex: 1 }),
            ]
        });

        await dataSource.transaction(async (manager) => {
            await templateService.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await templateRepo.findOne({ where: { id: toUpdate.id }, relations: ['templateMenuItems', 'templateMenuItems.menuItem'] });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(newName);
        // the template pulled to update has 0 items, so the length should be the same as the dto
        expect(result.templateMenuItems.length).toEqual(dto.templateMenuItems?.length ?? 0);
    });

    it('removes template menu items via authoritative parent update', async () => {
        const menuItems = await menuItemRepo.find({ take: 2 });
        if (menuItems.length < 2) throw new Error('menu items not found');

        const createDto = plainToInstance(CreateTemplateDto, {
            name: 'Template for delete test',
            templateMenuItems: [
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c11',
                    displayName: 'A',
                    menuItemId: menuItems[0].id,
                    tablePosIndex: 1,
                }),
                plainToInstance(NestedCreateTemplateMenuItemDto, {
                    createId: 'c12',
                    displayName: 'B',
                    menuItemId: menuItems[1].id,
                    tablePosIndex: 2,
                }),
            ],
        });

        const created = await dataSource.transaction(async (manager) => {
            return await templateService.createEntityForTest(createDto, manager);
        });

        const toUpdate = await templateRepo.findOne({
            where: { id: created.id },
            relations: ['templateMenuItems', 'templateMenuItems.menuItem'],
        });
        if (!toUpdate) throw new Error('template not found');
        expect(toUpdate.templateMenuItems.length).toEqual(2);

        const updateDto = plainToInstance(UpdateTemplateDto, {
            name: toUpdate.name,
            templateMenuItems: [],
        });

        await dataSource.transaction(async (manager) => {
            await templateService.updateEntityForTest(updateDto, toUpdate, manager);
        });

        const reloaded = await templateRepo.findOne({
            where: { id: toUpdate.id },
            relations: ['templateMenuItems'],
        });
        if (!reloaded) throw new Error('reloaded template not found');
        expect(reloaded.templateMenuItems.length).toEqual(0);

        const childRows = await templateItemRepo.find({
            where: { parentTemplate: { id: toUpdate.id } },
        });
        expect(childRows.length).toEqual(0);
    });

    // test findAll()
    it('should find all templates', async () => {
        const repoResult = await templateRepo.find();
        const serviceResult = await templateService.findAll({ limit: 100, relations: ['templateMenuItems'] });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findOne()
    it('should find one template', async () => {
        const t = await templateRepo.find({ take: 1 });
        if (!t.length) throw new Error('template not found');

        const serviceResult = await templateService.findOne(t[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(t[0].id);
    });

    // test remove()
    it('should remove template', async () => {
        const t = await templateRepo.findOne({ where: { name: 'Test Template' } });
        if (!t)
            throw new Error('template not found (create "Test Template" first)');
        const id = t.id;

        const deleteResult = await templateService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(templateService.findOne(id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
