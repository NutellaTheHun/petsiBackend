import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b, item_g } from '../../menu-items/utils/constants';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { type_a, type_c, type_d } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeService } from './label-type.service';
import { LabelService } from './label.service';

describe('Label Service', () => {
    let labelService: LabelService;
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let typeService: LabelTypeService;
    let itemService: MenuItemService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule();

        labelService = module.get<LabelService>(LabelService);
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initLabelTestDatabase(dbTestContext);

        typeService = module.get<LabelTypeService>(LabelTypeService);
        itemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(labelService).toBeDefined();
    });

    it('should create a label', async () => {
        const item = await itemService.findOneByName(item_g);
        if (!item) { throw new NotFoundException(); }
        const lblType = await typeService.findOneByName(type_d);
        if (!lblType) { throw new NotFoundException(); }

        const dto = {
            menuItemId: item.id,
            imageUrl: "testUrl",
            labelTypeId: lblType.id,
        } as CreateLabelDto;

        const result = await labelService.create(dto);
        if (!result) { throw new Error(); }
        if (!result.labelType) { throw new Error(); }

        expect(result).not.toBeNull();
        expect(result.imageUrl).toEqual("testUrl");
        expect(result.menuItem.id).toEqual(item.id);
        expect(result.labelType.id).toEqual(lblType.id);

        testId = result?.id as number;
    });

    it('should find a label by id', async () => {
        const result = await labelService.findOne(testId);

        expect(result).not.toBeNull();
        expect(result?.imageUrl).toEqual("testUrl");
        expect(result?.id).toEqual(testId);
    });

    it('should find labels by menuItem', async () => {
        const item = await itemService.findOneByName(item_a);
        if (!item) { throw new Error(); }

        const labels = await labelService.findByMenuItemId(item.id);

        expect(labels).not.toBeNull();
        expect(labels.length).toEqual(1);
    });

    it('should update label menuItem', async () => {
        const newItem = await itemService.findOneByName(item_b);
        if (!newItem) { throw new NotFoundException(); }
        const dto = {
            menuItemId: newItem.id
        } as UpdateLabelDto;

        const result = await labelService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.menuItem.id).toEqual(newItem.id);
    });

    it('should update imageUrl', async () => {
        const dto = {
            imageUrl: "update testUrl"
        } as UpdateLabelDto;

        const result = await labelService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.imageUrl).toEqual("update testUrl");
    });

    it('should update type', async () => {
        const newType = await typeService.findOneByName(type_c);
        if (!newType) { throw new NotFoundException(); }

        const dto = {
            labelTypeId: newType.id
        } as UpdateLabelDto;

        const result = await labelService.update(testId, dto);
        if (!result.labelType) { throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.labelType.id).toEqual(newType.id);
    });

    it('should find all labels', async () => {
        const results = await labelService.findAll();

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(8);

        testIds = results.items.slice(0, 3).map(label => label.id);
    });

    it('should sort all labels', async () => {
        const results = await labelService.findAll({ sortBy: 'labelType' });

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(8);

        testIds = results.items.slice(0, 3).map(label => label.id);
    });

    it('should find labels by list of ids', async () => {
        const results = await labelService.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should search for labels', async () => {
        const results = await labelService.findAll({
            search: "item a",
            relations: ['menuItem', 'labelType']
        });

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(1);
    });

    it('should filter by label type', async () => {
        const labelType = await typeService.findOneByName(type_a);
        if (!labelType) { throw new Error(); }

        const results = await labelService.findAll({
            filters: [`labelType=${labelType.id}`],
            relations: ['menuItem', 'labelType']
        });

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(2);
    });

    it('should filter and search by label type', async () => {
        const labelType = await typeService.findOneByName(type_a);
        if (!labelType) { throw new Error(); }

        const results = await labelService.findAll({
            search: 'item a',
            filters: [`labelType=${labelType.id}`],
            relations: ['menuItem', 'labelType']
        });

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(1);
    });

    it('should remove a label', async () => {
        const removal = await labelService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(labelService.findOne(testId)).rejects.toThrow(NotFoundException);
    });
});
