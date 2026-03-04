import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_g } from '../utils/constants';
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

describe('menu item container item service', () => {
    let testingUtil: MenuItemTestingUtil;
    let containerItemService: TestableMenuItemContainerItemService;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemContainerItemServiceClass: TestableMenuItemContainerItemService,
        });
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);

        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

        dataSource = module.get(DataSource);

        containerItemService = module.get(
            MenuItemContainerItemService,
        ) as TestableMenuItemContainerItemService;
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(containerItemService).toBeDefined();
    });

    // test createEntity()
    it('should create container item', async () => {
        const parent = await menuItemRepo.findOne({
            where: { name: item_g },
            relations: ['sizes'],
        });
        const contained = await menuItemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!parent?.sizes?.length || !contained?.sizes?.length)
            throw new Error('parent or contained not found');

        const dto = plainToInstance(CreateMenuItemContainerItemDto, {
            parentMenuItemId: parent.id,
            parentItemSizeId: parent.sizes[0].id,
            containedMenuItemId: contained.id,
            containedItemSizeId: contained.sizes[0].id,
            quantity: 2,
        });

        await dataSource.transaction(async (manager) => {
            const result = await containerItemService.createEntityForTest(dto, manager);
            const saved = await manager.save(result);
            expect(saved).not.toBeNull();
            expect(saved?.id).toBeDefined();
            expect(saved.quantity).toEqual(dto.quantity);
        });
    });

    // test updateEntity()
    it('should update container item', async () => {
        const existing = await containerItemRepo.findOne({
            where: {},
            relations: ['parentMenuItem', 'parentItemSize', 'containedMenuItem', 'containedItemSize'],
        });
        if (!existing) throw new Error('container item not found');

        const dto = menuItemContainerItemToUpdateDto(existing, { quantity: 10 });

        await dataSource.transaction(async (manager) => {
            await containerItemService.updateEntityForTest(dto, existing, manager);
        });

        const result = await containerItemRepo.findOne({
            where: { id: existing.id },
        });
        if (!result) throw new Error('result not found');
        expect(result.quantity).toEqual(dto.quantity);
    });

    // test findAll()
    it('should find all container items', async () => {
        const repoResult = await containerItemRepo.find();
        const serviceResult = await containerItemService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with sort by containedMenuItem name
    it('should find all container items with sort by containedMenuItem name', async () => {
        const serviceResult = await containerItemService.findAll({
            sortBy: 'containedMenuItem',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
    });

    // test findOne()
    it('should find one container item', async () => {
        const c = await containerItemRepo.find({ take: 1 });
        if (!c.length) throw new Error('container item not found');

        const serviceResult = await containerItemService.findOne(c[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(c[0].id);
    });

    // test findOne() with relations
    it('should find one container item with relations', async () => {
        const c = await containerItemRepo.find({ take: 1 });
        if (!c.length) throw new Error('container item not found');

        const serviceResult = await containerItemService.findOne(c[0].id, [
            'containedMenuItem',
            'parentMenuItem',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(c[0].id);
        expect(serviceResult?.containedMenuItem).toBeDefined();
        expect(serviceResult?.parentMenuItem).toBeDefined();
    });

    // test remove()
    it('should remove container item', async () => {
        const c = await containerItemRepo.find({ take: 1 });
        if (!c.length) throw new Error('container item not found');
        const id = c[0].id;

        const deleteResult = await containerItemService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(containerItemService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
