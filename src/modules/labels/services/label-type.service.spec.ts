import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeService } from './label-type.service';

class TestableLabelTypeService extends LabelTypeService {
    async createEntityForTest(
        dto: CreateLabelTypeDto,
        manager: EntityManager,
    ): Promise<LabelType> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateLabelTypeDto,
        entity: LabelType,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Label type Service', () => {
    let typeService: TestableLabelTypeService;
    let testingUtil: LabelTestingUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let typeRepo: Repository<LabelType>;

    let labelTypes: LabelType[];

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule({
            labelTypeServiceClass: TestableLabelTypeService,
        });

        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        typeService = module.get(LabelTypeService) as TestableLabelTypeService;
        dataSource = module.get(DataSource);
        typeRepo = module.get(getRepositoryToken(LabelType));

        ({ labelTypes } = await testingUtil.seedLabelTypes(P));
    });

    afterAll(async () => {
        await typeRepo.delete(labelTypes.map((t) => t.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('label type lifecycle', () => {
        let type: LabelType;

        it('should create type', async () => {
            const dto = plainToInstance(CreateLabelTypeDto, {
                name: `${P}-lifecycle-type`,
                length: 500,
                width: 300,
            });

            await dataSource.transaction(async (manager) => {
                type = await typeService.createEntityForTest(dto, manager);
            });
            expect(type.id).toBeDefined();
            expect(type.name).toBe(dto.name);
            expect(type.length).toBe(dto.length);
            expect(type.width).toBe(dto.width);
        });

        it('should update type', async () => {
            const dto = plainToInstance(UpdateLabelTypeDto, {
                name: `${P}-lifecycle-type-updated`,
                length: 500,
                width: 250,
            });

            await dataSource.transaction(async (manager) => {
                await typeService.updateEntityForTest(dto, type, manager);
            });

            const reloaded = await typeRepo.findOneOrFail({ where: { id: type.id } });
            expect(reloaded.name).toBe(dto.name);
            expect(reloaded.width).toBe(dto.width);
        });

        it('should remove type', async () => {
            await typeService.remove(type.id);
            await expect(typeService.findOne(type.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should find seeded type in findAll results', async () => {
        const result = await typeService.findAll({ limit: 100 });
        const found = result.items.find((t) => t.id === labelTypes[0].id);
        expect(found).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(typeService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(LabelTypeService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const type = await typeRepo.findOneOrFail({ where: { id: labelTypes[1].id } });
            const dto = plainToInstance(UpdateLabelTypeDto, {
                name: type.name,
                length: type.length,
                width: type.width,
            });
            const result = await typeService.update(type.id, dto);
            expect(result.name).toBe(type.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const type = await typeRepo.findOneOrFail({ where: { id: labelTypes[2].id } });
            const dto = plainToInstance(UpdateLabelTypeDto, {
                name: `${P}-type-renamed`,
                length: type.length,
                width: type.width,
            });
            await typeService.update(type.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await typeRepo.findOneOrFail({ where: { id: type.id } });
            expect(row.name).toBe(`${P}-type-renamed`);
        });
    });
});
