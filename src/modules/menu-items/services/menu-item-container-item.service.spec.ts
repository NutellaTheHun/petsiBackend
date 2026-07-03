import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { menuItemContainerItemToUpdateDto } from '../utils/entity-transformers/menu-item-container-item.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerItemService } from './menu-item-container-item.service';

class TestableMenuItemContainerItemService extends MenuItemContainerItemService {
    async createEntityForTest(
        dto: CreateMenuItemContainerItemDto,
        manager: EntityManager,
    ): Promise<MenuItemContainerItem> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateMenuItemContainerItemDto,
        entity: MenuItemContainerItem,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('menu item container item service', () => {
    let testingUtil: MenuItemTestingUtil;
    let service: TestableMenuItemContainerItemService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    let categories: MenuItemCategory[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let sizes: MenuItemSize[];
    let containerLines: MenuItemContainerItem[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemContainerItemServiceClass: TestableMenuItemContainerItemService,
        });
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        service = module.get<MenuItemContainerItemService>(
            MenuItemContainerItemService,
        ) as TestableMenuItemContainerItemService;
        dataSource = module.get(DataSource);
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ categories, singleItems, fixedContainerItems, varContainerItems, sizes, containerLines } =
            await testingUtil.seedContainerLines(P));
    });

    afterAll(async () => {
        await containerItemRepo.delete(containerLines.map((l) => l.id));
        await itemRepo.delete([
            ...fixedContainerItems.map((i) => i.id),
            ...varContainerItems.map((i) => i.id),
            ...singleItems.map((i) => i.id),
        ]);
        await categoryRepo.delete(categories.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('container item lifecycle', () => {
        let created: MenuItemContainerItem;

        it('should create container item', async () => {
            const parent = fixedContainerItems[0];
            // singleItems[2] is not seeded as a contained item for fixedContainerItems
            const contained = singleItems[2];
            const dto = plainToInstance(CreateMenuItemContainerItemDto, {
                parentMenuItemId: parent.id,
                parentItemSizeId: sizes[2].id,
                containedMenuItemId: contained.id,
                containedItemSizeId: sizes[0].id,
                quantity: 2,
            });
            await dataSource.transaction(async (manager) => {
                const result = await service.createEntityForTest(dto, manager);
                created = await manager.save(result);
            });
            expect(created.id).toBeDefined();
            expect(created.quantity).toBe(2);
        });

        it('should update container item', async () => {
            const reloaded = await containerItemRepo.findOneOrFail({
                where: { id: created.id },
                relations: ['parentMenuItem', 'parentItemSize', 'containedMenuItem', 'containedItemSize'],
            });
            const dto = menuItemContainerItemToUpdateDto(reloaded, { quantity: 10 });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, reloaded, manager);
            });
            const updated = await containerItemRepo.findOneOrFail({ where: { id: created.id } });
            expect(updated.quantity).toBe(10);
        });

        it('should remove container item', async () => {
            const result = await service.remove(created.id);
            expect(result).toBe(true);
            await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded container line in findAll results', async () => {
        const result = await service.findAll({ limit: 100 });
        const found = result.items.find((ci) => ci.id === containerLines[0].id);
        expect(found).toBeDefined();
    });

    it('should find all container items with filter by parentMenuItem', async () => {
        const parent = fixedContainerItems[0];
        const linesForParent = containerLines.filter(
            (l) => l.parentMenuItem.id === parent.id,
        );
        const result = await service.findAll({
            filters: [`parentMenuItem=${parent.id}`],
            limit: 100,
        });
        expect(result.items.length).toBe(linesForParent.length);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });
});
