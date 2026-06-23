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

describe('menu item revision history (controller)', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: MenuItemController;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    beforeAll(async () => {
        module = await getMenuItemTestingModule({ mockRevisionHistory: false });
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

        controller = module.get<MenuItemController>(MenuItemController);
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
        await module.close();
    });

    it('creates revisions on create/update and records revert', async () => {
        const rhs = module.get(RevisionHistoryService);
        expect(typeof (rhs as any).listRevisions).toEqual('function');

        const [cat] = await categoryRepo.find({ take: 1 });
        if (!cat) throw new Error('category not found');
        const sizeIds = (await sizeRepo.find({ take: 2 })).map((s) => s.id);
        if (sizeIds.length < 1) throw new Error('sizes not found');

        const dto = plainToInstance(CreateMenuItemDto, {
            name: 'Revision History Menu Item',
            categoryId: cat.id,
            type: MENU_ITEM_TYPES.SINGLE,
            sizeIds,
        });

        const created = await controller.create(dto);
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
        const updateDto = menuItemToUpdateDto(row, { name: 'Revision History Menu Item v2' });
        await controller.update(created.id, updateDto);

        const afterUpdate = await rhs.listRevisions('menu_item', created.id);
        expect(afterUpdate.length).toBeGreaterThanOrEqual(2);
        expect(afterUpdate[0].revisionNumber).toEqual(2);
        expect(afterUpdate[0].changeLog.kind).toEqual('updated');

        const reverted = await controller.revertMenuItem(created.id, 1);
        expect(reverted.name).toEqual('Revision History Menu Item');

        const afterRevert = await rhs.listRevisions('menu_item', created.id);
        expect(afterRevert[0].revisionNumber).toEqual(3);
        expect(afterRevert[0].changeLog.kind).toEqual('reverted');
    });

    it('serves changeLog and payload in detail endpoint', async () => {
        const rhs = module.get(RevisionHistoryService);
        expect(typeof (rhs as any).listRevisions).toEqual('function');

        const [cat] = await categoryRepo.find({ take: 1 });
        if (!cat) throw new Error('category not found');
        const sizeIds = (await sizeRepo.find({ take: 1 })).map((s) => s.id);
        if (!sizeIds.length) throw new Error('sizes not found');

        const created = await controller.create(
            plainToInstance(CreateMenuItemDto, {
                name: 'Revision Detail Menu Item',
                categoryId: cat.id,
                type: MENU_ITEM_TYPES.SINGLE,
                sizeIds,
            }),
        );

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

