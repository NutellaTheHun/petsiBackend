import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
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

const P = `t${Date.now()}`;

describe('Template menu item service', () => {
    let testingUtil: TemplateTestingUtil;
    let templateItemService: TestableTemplateMenuItemService;
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
            templateMenuItemServiceClass: TestableTemplateMenuItemService,
        });
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        templateItemService = module.get(
            TemplateMenuItemService,
        ) as TestableTemplateMenuItemService;
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

    describe('template menu item lifecycle', () => {
        let templateMenuItem: TemplateMenuItem;

        it('should create template menu item', async () => {
            const dto = plainToInstance(CreateTemplateMenuItemDto, {
                displayName: `${P}-lifecycle-row`,
                tablePosIndex: 50,
                menuItemId: singleItems[2].id,
                parentTemplateId: templates[0].id,
            });
            await dataSource.transaction(async (manager) => {
                templateMenuItem = await templateItemService.createEntityForTest(
                    dto,
                    manager,
                );
            });
            expect(templateMenuItem.id).toBeDefined();
            expect(templateMenuItem.displayName).toBe(dto.displayName);
        });

        it('should update template menu item', async () => {
            const dto = plainToInstance(UpdateTemplateMenuItemDto, {
                displayName: `${P}-lifecycle-row-updated`,
                tablePosIndex: 51,
                menuItemId: singleItems[3].id,
            });
            await dataSource.transaction(async (manager) => {
                await templateItemService.updateEntityForTest(
                    dto,
                    templateMenuItem,
                    manager,
                );
            });
            const reloaded = await templateItemRepo.findOneOrFail({
                where: { id: templateMenuItem.id },
                relations: ['menuItem'],
            });
            expect(reloaded.displayName).toBe(dto.displayName);
            expect(reloaded.tablePosIndex).toBe(dto.tablePosIndex);
            expect(reloaded.menuItem.id).toBe(singleItems[3].id);
        });

        it('should remove template menu item', async () => {
            await templateItemService.remove(templateMenuItem.id);
            await expect(
                templateItemService.findOne(templateMenuItem.id),
            ).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded template menu item in findAll results', async () => {
        const result = await templateItemService.findAll({ limit: 100 });
        const found = result.items.find((i) => i.id === templateMenuItems[0].id);
        expect(found).toBeDefined();
    });

    it('should find seeded template menu items filtered by parentTemplate', async () => {
        const expectedIds = templateMenuItems
            .filter((i) => i.parentTemplate.id === templates[0].id)
            .map((i) => i.id)
            .sort();
        expect(expectedIds.length).toBeGreaterThan(0);

        const result = await templateItemService.findAll({
            filters: [`parentTemplate=${templates[0].id}`],
            limit: 100,
        });
        expect(result.items.map((i) => i.id).sort()).toEqual(
            expect.arrayContaining(expectedIds),
        );
        expect(
            result.items.every(
                (i) => i.parentTemplate?.id === templates[0].id || !i.parentTemplate,
            ),
        ).toBe(true);
    });

    it('should find one template menu item with relations', async () => {
        const result = await templateItemService.findOne(templateMenuItems[1].id, [
            'parentTemplate',
            'menuItem',
        ]);
        expect(result.id).toBe(templateMenuItems[1].id);
        expect(result.parentTemplate).toBeDefined();
        expect(result.menuItem).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(templateItemService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
