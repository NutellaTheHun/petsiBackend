import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelController } from './label.controller';

const P = `t${Date.now()}`;

describe('label controller', () => {
    let testingUtil: LabelTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: LabelController;
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
        const module: TestingModule = await getLabelsTestingModule();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        controller = module.get<LabelController>(LabelController);
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

    it('create throws ValidationException when labelType and menuItem pair already exists', async () => {
        const existingLabel = labels[0];

        const dto = plainToInstance(CreateLabelDto, {
            imageUrl: `${P}-colliding-label.png`,
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

    it('remove deletes a created label then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateLabelDto, {
                menuItemId: singleItems[0].id,
                labelTypeId: labelTypes[1].id,
                imageUrl: `${P}-to-remove.png`,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
