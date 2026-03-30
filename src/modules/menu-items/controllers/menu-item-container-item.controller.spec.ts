import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerItemController } from './menu-item-container-item.controller';

describe('menu item container item controller', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: MenuItemContainerItemController;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        module = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

        controller = module.get<MenuItemContainerItemController>(
            MenuItemContainerItemController,
        );
        containerItemRepo = module.get(
            getRepositoryToken(MenuItemContainerItem),
        );
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await containerItemRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy containedMenuItem returns non-empty list', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'containedMenuItem',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findAll with filter by parentMenuItem matches parent line count', async () => {
        const parent = await menuItemRepo.findOneOrFail({
            where: { containerMenuItems: MoreThan(0) },
            relations: ['containerMenuItems'],
        });
        if (!parent.containerMenuItems) {
            throw new Error('container menu items not found');
        }
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`parentMenuItem=${parent.id}`],
        );
        expect(result.items.length).toEqual(parent.containerMenuItems.length);
    });

    it('findOne returns a seeded container line', async () => {
        const row = await containerItemRepo.findOne({
            where: {},
            relations: ['parentMenuItem', 'containedMenuItem'],
        });
        if (!row) throw new Error('no seeded container item');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a container line then findOne fails', async () => {
        const row = await containerItemRepo.findOne({ where: {} });
        if (!row) throw new Error('no row to remove');
        const id = row.id;
        await controller.remove(id);
        await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
