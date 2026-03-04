import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { templateMenuItemToUpdateDto } from '../utils/entity-transformers/template-menu-item.dto.transformer';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemService } from './template-menu-item.service';

class TestableTemplateMenuItemService extends TemplateMenuItemService {
    async createEntityForTest(
        dto: CreateTemplateMenuItemDto,
        manager: EntityManager,
    ): Promise<TemplateMenuItem> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateTemplateMenuItemDto,
        entity: TemplateMenuItem,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}
describe('Template menu item service', () => {
    let templateItemService: TestableTemplateMenuItemService;
    let testUtil: TemplateTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let templateMenuItemRepo: Repository<TemplateMenuItem>;
    let templateRepo: Repository<Template>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemTestUtil: MenuItemTestingUtil;

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule({
            templateMenuItemServiceClass: TestableTemplateMenuItemService,
        });
        dbTestContext = new DatabaseTestContext();
        testUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        await testUtil.initTemplateMenuItemTestDatabase(dbTestContext);

        templateItemService = module.get(TemplateMenuItemService) as TestableTemplateMenuItemService;
        dataSource = module.get(DataSource);
        templateMenuItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
        templateRepo = module.get(getRepositoryToken(Template));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(templateItemService).toBeDefined();
    });

    // test createEntity() with CreateTemplateMenuItemDto
    it('should create template menu item with CreateTemplateMenuItemDto', async () => {
        const [t] = await templateRepo.find({ take: 1 });
        const [m] = await menuItemRepo.find({ take: 1 });
        if (!t || !m) throw new Error('fixtures not found');
        const dto = plainToInstance(CreateTemplateMenuItemDto, {
            displayName: 'NEW_ROW',
            tablePosIndex: 999,
            menuItemId: m.id,
            parentTemplateId: t.id,
        });

        await dataSource.transaction(async (manager) => {
            const result = await templateItemService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.displayName).toEqual(dto.displayName);
        });
    });

    // test updateEntity()
    it('should update template menu item', async () => {
        const [existing] = await templateMenuItemRepo.find({ take: 1, relations: ['menuItem', 'parentTemplate'] });
        if (!existing) throw new Error('template menu item not found');

        const dto = templateMenuItemToUpdateDto(existing, { displayName: 'Updated', tablePosIndex: 2 });

        await dataSource.transaction(async (manager) => {
            await templateItemService.updateEntityForTest(dto, existing, manager);
            await manager.save(existing);
        });

        const result = await templateMenuItemRepo.findOne({ where: { id: existing.id } });
        if (!result) throw new Error('result not found');
        expect(result.displayName).toEqual(dto.displayName);
        expect(result.tablePosIndex).toEqual(dto.tablePosIndex);
    });

    // test findAll()
    it('should find all template menu items', async () => {
        const repoResult = await templateMenuItemRepo.find();
        const serviceResult = await templateItemService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with search by name
    it('should find all template menu items with search by name', async () => {
        const serviceResult = await templateItemService.findAll({
            search: 'test',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
    });

    // test findAll() with sortBy tablePosIndex
    it('should find all template menu items with sortBy tablePosIndex', async () => {
        const serviceResult = await templateItemService.findAll({
            sortBy: 'tablePosIndex',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
    });

    // test findOne()
    it('should find one template menu item', async () => {
        const [t] = await templateMenuItemRepo.find({ take: 1 });
        if (!t) throw new Error('template menu item not found');

        const serviceResult = await templateItemService.findOne(t.id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(t.id);
    });

    // test findOne() with relations
    it('should find one template menu item with relations', async () => {
        const [t] = await templateMenuItemRepo.find({ take: 1 });
        if (!t) throw new Error('template menu item not found');

        const serviceResult = await templateItemService.findOne(t.id, [
            'parentTemplate',
            'menuItem',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(t.id);
        expect(serviceResult?.parentTemplate).toBeDefined();
        expect(serviceResult?.menuItem).toBeDefined();
    });

    // test remove()
    it('should remove template menu item', async () => {
        const [t] = await templateMenuItemRepo.find({
            where: { displayName: 'NEW_ROW' },
        });
        if (!t) {
            const [alt] = await templateMenuItemRepo.find({ take: 1 });
            if (!alt) throw new Error('template menu item not found');
            const id = alt.id;
            const deleteResult = await templateItemService.remove(id);
            expect(deleteResult).toBe(true);
            await expect(templateItemService.findOne(id)).rejects.toThrow(NotFoundException);
            return;
        }
        const id = t.id;
        const deleteResult = await templateItemService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(templateItemService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
