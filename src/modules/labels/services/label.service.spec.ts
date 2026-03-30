import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Like, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelService } from './label.service';

class TestableLabelService extends LabelService {
    async createEntityForTest(
        dto: CreateLabelDto,
        manager: EntityManager,
    ): Promise<Label> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateLabelDto,
        entity: Label,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

describe('Label Service', () => {
    let labelService: TestableLabelService;
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    let labelRepo: Repository<Label>;
    let labelTypeRepo: Repository<LabelType>;
    let itemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule({
            labelServiceClass: TestableLabelService,
        });

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        await testingUtil.initLabelTestDatabase(dbTestContext);

        labelService = module.get(LabelService) as TestableLabelService;
        dataSource = module.get(DataSource);
        labelRepo = module.get(getRepositoryToken(Label));
        labelTypeRepo = module.get(getRepositoryToken(LabelType));
        itemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(labelService).toBeDefined();
    });

    // test createEntity()
    it('should create label', async () => {
        const menuItem = await itemRepo.findOne({ where: {} });
        const labelType = await labelTypeRepo.findOne({ where: {} });
        if (!menuItem || !labelType) throw new Error('menuItem or labelType not found');

        const dto = plainToInstance(CreateLabelDto, {
            menuItemId: menuItem.id,
            labelTypeId: labelType.id,
            imageUrl: 'https://example.com/new-label.png',
        });

        await dataSource.transaction(async (manager) => {
            const result = await labelService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.imageUrl).toEqual(dto.imageUrl);
            expect(result.menuItem?.id).toEqual(menuItem.id);
            expect(result.labelType?.id).toEqual(labelType.id);
        });
    });

    // test updateEntity()
    it('should update label', async () => {
        const label = await labelRepo.findOne({
            where: {},
            relations: ['menuItem', 'labelType'],
        });
        if (!label) throw new Error('label not found');

        const dto = plainToInstance(UpdateLabelDto, { imageUrl: 'https://example.com/updated.png' });

        await dataSource.transaction(async (manager) => {
            await labelService.updateEntityForTest(dto, label, manager);
        });

        const result = await labelRepo.findOne({ where: { id: label.id } });
        if (!result) throw new Error('result not found');
        expect(result.imageUrl).toEqual(dto.imageUrl);
    });

    // test findAll()
    it('should find all labels', async () => {
        const repoResult = await labelRepo.find();
        const serviceResult = await labelService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with search by menuItem name
    it('should find all labels with search by menuItem name', async () => {
        const menuItem = await itemRepo.findOne({ where: {} });
        const search = menuItem?.name ? menuItem.name.substring(0, 2) : 'e';

        const repoResult = await labelRepo.find({
            where: { menuItem: { name: Like(`%${search}%`) } },
        });
        const serviceResult = await labelService.findAll({
            search,
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with filter by labelType
    it('should find all labels with filter by labelType', async () => {
        const labelType = await labelTypeRepo.findOne({ where: {} });
        if (!labelType) throw new Error('labelType not found');

        const repoResult = await labelRepo.find({
            where: { labelType: { id: labelType.id } },
        });
        const serviceResult = await labelService.findAll({
            filters: [`labelType=${labelType.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with sortBy labelType
    it('should find all labels with sortBy labelType', async () => {
        const serviceResult = await labelService.findAll({
            sortBy: 'labelType',
            sortOrder: 'ASC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
        for (let i = 1; i < (serviceResult?.items.length ?? 0); i++) {
            const prev = serviceResult!.items[i - 1].labelType?.name ?? '';
            const curr = serviceResult!.items[i].labelType?.name ?? '';
            expect(prev <= curr).toBe(true);
        }
    });

    // test findOne()
    it('should find one label', async () => {
        const label = await labelRepo.find({ take: 1 });
        if (!label.length) throw new Error('label not found');

        const serviceResult = await labelService.findOne(label[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(label[0].id);
    });

    // test findOne() with relations
    it('should find one label with relations', async () => {
        const label = await labelRepo.find({
            take: 1,
            relations: ['menuItem', 'labelType'],
        });
        if (!label.length) throw new Error('label not found');

        const serviceResult = await labelService.findOne(label[0].id, [
            'menuItem',
            'labelType',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(label[0].id);
        expect(serviceResult?.menuItem).toBeDefined();
        expect(serviceResult?.labelType).toBeDefined();
    });

    // test remove()
    it('should remove label', async () => {
        const label = await labelRepo.find({ take: 1 });
        if (!label.length) throw new Error('label not found');
        const id = label[0].id;

        const deleteResult = await labelService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(labelService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
