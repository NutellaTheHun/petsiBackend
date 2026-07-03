import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
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

const P = `t${Date.now()}`;

describe('Label Service', () => {
    let labelService: TestableLabelService;
    let testingUtil: LabelTestingUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let labelRepo: Repository<Label>;
    let labelTypeRepo: Repository<LabelType>;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    let labelTypes: LabelType[];
    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let labels: Label[];

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule({
            labelServiceClass: TestableLabelService,
        });

        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        labelService = module.get(LabelService) as TestableLabelService;
        dataSource = module.get(DataSource);
        labelRepo = module.get(getRepositoryToken(Label));
        labelTypeRepo = module.get(getRepositoryToken(LabelType));
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ labelTypes, categories, sizes, singleItems, fixedContainerItems, varContainerItems, labels } =
            await testingUtil.seedLabels(P));
    });

    afterAll(async () => {
        await labelRepo.delete(labels.map((l) => l.id));
        await labelTypeRepo.delete(labelTypes.map((t) => t.id));
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

    describe('label lifecycle', () => {
        let label: Label;

        it('should create label', async () => {
            const dto = plainToInstance(CreateLabelDto, {
                menuItemId: singleItems[0].id,
                labelTypeId: labelTypes[0].id,
                imageUrl: `${P}-lifecycle-label.png`,
            });

            await dataSource.transaction(async (manager) => {
                label = await labelService.createEntityForTest(dto, manager);
            });
            expect(label.id).toBeDefined();
            expect(label.imageUrl).toBe(dto.imageUrl);
            expect(label.menuItem.id).toBe(singleItems[0].id);
            expect(label.labelType.id).toBe(labelTypes[0].id);
        });

        it('should update label', async () => {
            const dto = plainToInstance(UpdateLabelDto, {
                imageUrl: `${P}-lifecycle-label-updated.png`,
            });

            await dataSource.transaction(async (manager) => {
                await labelService.updateEntityForTest(dto, label, manager);
            });

            const reloaded = await labelRepo.findOneOrFail({ where: { id: label.id } });
            expect(reloaded.imageUrl).toBe(dto.imageUrl);
        });

        it('should remove label', async () => {
            await labelService.remove(label.id);
            await expect(labelService.findOne(label.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should find seeded label in findAll search results by menuItem name', async () => {
        const result = await labelService.findAll({
            search: singleItems[0].name,
            limit: 100,
        });
        const found = result.items.find((l) => l.id === labels[0].id);
        expect(found).toBeDefined();
    });

    it('should find seeded labels filtered by labelType', async () => {
        const result = await labelService.findAll({
            filters: [`labelType=${labelTypes[0].id}`],
            limit: 100,
        });
        const found = result.items.find((l) => l.id === labels[0].id);
        expect(found).toBeDefined();
        expect(
            result.items.every(
                (l) => l.labelType?.id === labelTypes[0].id || !l.labelType,
            ),
        ).toBe(true);
    });

    it('should find one label with relations', async () => {
        const result = await labelService.findOne(labels[0].id, [
            'menuItem',
            'labelType',
        ]);
        expect(result.id).toBe(labels[0].id);
        expect(result.menuItem).toBeDefined();
        expect(result.labelType).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(labelService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(LabelService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const label = await labelRepo.findOneOrFail({
                where: { id: labels[1].id },
                relations: ['menuItem', 'labelType'],
            });
            const dto = plainToInstance(UpdateLabelDto, {
                imageUrl: label.imageUrl,
                menuItemId: label.menuItem.id,
                labelTypeId: label.labelType.id,
            });
            const result = await labelService.update(label.id, dto);
            expect(result.imageUrl).toBe(label.imageUrl);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when imageUrl changes', async () => {
            const label = await labelRepo.findOneOrFail({
                where: { id: labels[2].id },
                relations: ['menuItem', 'labelType'],
            });
            const dto = plainToInstance(UpdateLabelDto, {
                imageUrl: `${P}-label-renamed.png`,
            });
            await labelService.update(label.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await labelRepo.findOneOrFail({ where: { id: label.id } });
            expect(row.imageUrl).toBe(`${P}-label-renamed.png`);
        });
    });
});
