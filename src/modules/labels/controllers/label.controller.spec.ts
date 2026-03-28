import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Like, Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { LabelService } from '../services/label.service';
import { url_red } from '../utils/constants';
import { labelToUpdateDto } from '../utils/entity-transformers/label.dto.transformer';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelController } from './label.controller';

async function findUnusedMenuItemLabelTypePair(
    labelRepo: Repository<Label>,
    itemRepo: Repository<MenuItem>,
    labelTypeRepo: Repository<LabelType>,
): Promise<{ menuItem: MenuItem; labelType: LabelType }> {
    const menuItems = await itemRepo.find();
    const labelTypes = await labelTypeRepo.find();
    if (!menuItems.length || !labelTypes.length) {
        throw new Error('menu items or label types not found');
    }
    for (const item of menuItems) {
        for (const type of labelTypes) {
            const exists = await labelRepo.findOne({
                where: {
                    menuItem: { id: item.id },
                    labelType: { id: type.id },
                },
            });
            if (!exists) {
                return { menuItem: item, labelType: type };
            }
        }
    }
    throw new Error('no unused menuItem/labelType pair');
}

describe('label controller', () => {
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: LabelController;
    let labelRepo: Repository<Label>;
    let labelTypeRepo: Repository<LabelType>;
    let itemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        module = await getLabelsTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        await testingUtil.initLabelTestDatabase(dbTestContext);

        controller = module.get<LabelController>(LabelController);
        labelRepo = module.get(getRepositoryToken(Label));
        labelTypeRepo = module.get(getRepositoryToken(LabelType));
        itemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await labelRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search by menuItem name matches repository', async () => {
        const menuItem = await itemRepo.findOne({ where: {} });
        const search = menuItem?.name ? menuItem.name.substring(0, 2) : 'e';
        const repoResult = await labelRepo.find({
            where: { menuItem: { name: Like(`%${search}%`) } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            search,
            undefined,
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with filter by labelType matches repository', async () => {
        const labelType = await labelTypeRepo.findOne({ where: {} });
        if (!labelType) throw new Error('labelType not found');
        const repoResult = await labelRepo.find({
            where: { labelType: { id: labelType.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`labelType=${labelType.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with sortBy labelType orders ascending by type name', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'labelType',
            'ASC',
            undefined,
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
        for (let i = 1; i < result.items.length; i++) {
            const prev = result.items[i - 1].labelType?.name ?? '';
            const curr = result.items[i].labelType?.name ?? '';
            expect(prev <= curr).toBe(true);
        }
    });

    it('findOne returns a seeded label', async () => {
        const label = await labelRepo.findOne({
            where: { imageUrl: url_red },
            relations: ['menuItem', 'labelType'],
        });
        if (!label) throw new Error('seed label not found');
        const result = await controller.findOne(label.id);
        expect(result.id).toEqual(label.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new label', async () => {
        const { menuItem, labelType } = await findUnusedMenuItemLabelTypePair(
            labelRepo,
            itemRepo,
            labelTypeRepo,
        );

        const dto = plainToInstance(CreateLabelDto, {
            menuItemId: menuItem.id,
            labelTypeId: labelType.id,
            imageUrl: 'https://example.com/controller-label-create.png',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await labelRepo.findOne({ where: { id: result.id } });
        expect(row).not.toBeNull();
        expect(row!.imageUrl).toEqual(dto.imageUrl);
    });

    it('create throws ValidationException when labelType and menuItem pair already exists', async () => {
        const existingLabel = await labelRepo.findOne({
            where: {},
            relations: ['menuItem', 'labelType'],
        });
        if (!existingLabel) throw new Error('existing label not found');

        const dto = plainToInstance(CreateLabelDto, {
            imageUrl: url_red,
            menuItemId: existingLabel.menuItem.id,
            labelTypeId: existingLabel.labelType.id,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'labelType',
                ]),
            );
        }
    });

    it('update throws ValidationException when menuItem and labelType collide with another label', async () => {
        const labels = await labelRepo.find({
            relations: ['menuItem', 'labelType'],
        });
        if (labels.length < 2) throw new Error('Not enough labels for test');

        const labelToUpdate = labels[0];
        const existingLabel = labels[1];
        const dto = plainToInstance(UpdateLabelDto, {
            menuItemId: existingLabel.menuItem.id,
            labelTypeId: existingLabel.labelType.id,
            imageUrl: labelToUpdate.imageUrl,
        });
        try {
            await controller.update(labelToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'labelType',
                ]),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateLabelDto, {
            imageUrl: 'https://example.com/does-not-matter.png',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                LabelService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current label', async () => {
            const label = await labelRepo.findOne({
                where: {},
                relations: ['menuItem', 'labelType'],
            });
            if (!label) throw new Error('label not found');
            const dto = labelToUpdateDto(label);
            const result = await controller.update(label.id, dto);
            expect(result.imageUrl).toEqual(label.imageUrl);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when imageUrl changes', async () => {
            const label = await labelRepo.findOne({
                where: {},
                relations: ['menuItem', 'labelType'],
            });
            if (!label) throw new Error('label not found');
            const newUrl = 'https://example.com/controller-label-updated.png';
            const dto = labelToUpdateDto(label, { imageUrl: newUrl });
            const result = await controller.update(label.id, dto);
            expect(result.imageUrl).toEqual(newUrl);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await labelRepo.findOne({ where: { id: label.id } });
            expect(row!.imageUrl).toEqual(newUrl);
        });
    });

    it('remove deletes a created label then findOne fails', async () => {
        const { menuItem, labelType } = await findUnusedMenuItemLabelTypePair(
            labelRepo,
            itemRepo,
            labelTypeRepo,
        );

        const created = await controller.create(
            plainToInstance(CreateLabelDto, {
                menuItemId: menuItem.id,
                labelTypeId: labelType.id,
                imageUrl: 'https://example.com/controller-label-remove.png',
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
