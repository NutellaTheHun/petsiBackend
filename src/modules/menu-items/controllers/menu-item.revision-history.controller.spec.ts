import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { menuItemToUpdateDto } from '../utils/entity-transformers/menu-item.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemController } from './menu-item.controller';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';

const P = `t${Date.now()}`;

describe('menu item revision history (controller)', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let module: TestingModule;
    let controller: MenuItemController;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];

    beforeAll(async () => {
        module = await getMenuItemTestingModule({ mockRevisionHistory: false });
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        controller = module.get<MenuItemController>(MenuItemController);
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ categories, sizes, singleItems, fixedContainerItems, varContainerItems } =
            await testingUtil.seedItems(P));
    });

    afterAll(async () => {
        await itemRepo.delete([
            ...fixedContainerItems.map((i) => i.id),
            ...varContainerItems.map((i) => i.id),
            ...singleItems.map((i) => i.id),
        ]);
        await categoryRepo.delete(categories.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('creates revisions on create/update and records revert', async () => {
        const rhs = module.get(RevisionHistoryService);
        expect(typeof (rhs as any).listRevisions).toEqual('function');

        const dto = plainToInstance(CreateMenuItemDto, {
            name: `${P}-revision-item`,
            categoryId: categories[0].id,
            type: MENU_ITEM_TYPES.SINGLE,
            sizeIds: [sizes[0].id, sizes[1].id],
        });

        const created = await controller.create(dto);
        testCtx.addCleanupFunction(async () => { await itemRepo.delete(created.id); });

        const afterCreate = await rhs.listRevisions('menu_item', created.id);
        expect(afterCreate.length).toBeGreaterThanOrEqual(1);
        expect(afterCreate[0].revisionNumber).toEqual(1);
        expect(afterCreate[0].changeLog.kind).toEqual('created');

        const row = await itemRepo.findOneOrFail({
            where: { id: created.id },
            relations: [
                'category',
                'sizes',
                'containerMenuItems',
                'containerMenuItems.containedMenuItem',
                'containerMenuItems.containedItemSize',
            ],
        });
        const updateDto = menuItemToUpdateDto(row, { name: `${P}-revision-item-v2` });
        await controller.update(created.id, updateDto);

        const afterUpdate = await rhs.listRevisions('menu_item', created.id);
        expect(afterUpdate.length).toBeGreaterThanOrEqual(2);
        expect(afterUpdate[0].revisionNumber).toEqual(2);
        expect(afterUpdate[0].changeLog.kind).toEqual('updated');

        const reverted = await controller.revertMenuItem(created.id, 1);
        expect(reverted.name).toEqual(`${P}-revision-item`);

        const afterRevert = await rhs.listRevisions('menu_item', created.id);
        expect(afterRevert[0].revisionNumber).toEqual(3);
        expect(afterRevert[0].changeLog.kind).toEqual('reverted');
    });

    it('serves changeLog and payload in detail endpoint', async () => {
        const rhs = module.get(RevisionHistoryService);

        const created = await controller.create(
            plainToInstance(CreateMenuItemDto, {
                name: `${P}-revision-detail-item`,
                categoryId: categories[0].id,
                type: MENU_ITEM_TYPES.SINGLE,
                sizeIds: [sizes[0].id],
            }),
        );
        testCtx.addCleanupFunction(async () => { await itemRepo.delete(created.id); });

        const revisions = await rhs.listRevisions('menu_item', created.id);
        if (!revisions.length) throw new Error('expected menu item to have revisions');

        const rev = await rhs.getRevisionOrThrow(
            'menu_item',
            created.id,
            revisions[0].revisionNumber,
        );
        expect(rev.revisionNumber).toEqual(revisions[0].revisionNumber);
        expect(rev.changeLog).toBeDefined();
        expect(rev.payload).toBeDefined();
    });
});
