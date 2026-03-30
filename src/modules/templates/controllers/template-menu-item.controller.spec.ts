import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemController } from './template-menu-item.controller';

describe('TemplateMenuItemController', () => {
    let module: TestingModule;
    let dbTestContext: DatabaseTestContext;
    let testingUtil: TemplateTestingUtil;
    let controller: TemplateMenuItemController;
    let templateMenuItemRepo: Repository<TemplateMenuItem>;
    let templateRepo: Repository<Template>;

    beforeAll(async () => {
        module = await getTemplateTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get(TemplateTestingUtil);
        await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

        controller = module.get(TemplateMenuItemController);
        templateMenuItemRepo = module.get(
            getRepositoryToken(TemplateMenuItem),
        );
        templateRepo = module.get(getRepositoryToken(Template));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await templateMenuItemRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search returns matches for menu-linked display names', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'test',
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findAll with sortBy tablePosIndex DESC returns non-empty ordered list', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'tablePosIndex',
            'DESC',
        );
        expect(result.items.length).toBeGreaterThan(0);
        for (let i = 1; i < result.items.length; i++) {
            expect(result.items[i - 1].tablePosIndex).toBeGreaterThanOrEqual(
                result.items[i].tablePosIndex,
            );
        }
    });

    it('findAll with parentTemplate filter matches template row counts', async () => {
        const withItems = await templateRepo.find({
            relations: ['templateMenuItems'],
        });
        const picked = withItems.find(
            (t) => (t.templateMenuItems?.length ?? 0) > 0,
        );
        if (!picked?.templateMenuItems?.length) {
            throw new Error('no template with menu items');
        }
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`parentTemplate=${picked.id}`],
        );
        expect(result.items.length).toEqual(picked.templateMenuItems.length);
    });

    it('findOne returns a seeded template menu item', async () => {
        const row = await templateMenuItemRepo.find({ take: 1 });
        if (!row.length) throw new Error('no template menu items');
        const result = await controller.findOne(row[0].id);
        expect(result.id).toEqual(row[0].id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a row then findOne fails', async () => {
        const row = await templateMenuItemRepo.find({ take: 1 });
        if (!row.length) throw new Error('no template menu items');
        const id = row[0].id;
        await controller.remove(id);
        await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
