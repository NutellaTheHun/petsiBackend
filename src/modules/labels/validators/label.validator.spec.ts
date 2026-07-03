import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
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
import { LabelValidator } from './label.validator';

const P = `t${Date.now()}`;

describe('label validator', () => {
    let testingUtil: LabelTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: LabelValidator;
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
        validator = module.get<LabelValidator>(LabelValidator);

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

    // Create Validation Tests
    it('successfully validate create with no validation errors', async () => {
        // labels[0] pairs singleItems[0] with labelTypes[0]; labelTypes[1] is unused for singleItems[0]
        const dto: CreateLabelDto = plainToInstance(CreateLabelDto, {
            imageUrl: `${P}-new-label.png`,
            menuItemId: singleItems[0].id,
            labelTypeId: labelTypes[1].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: labelType and menuItem already exists for this item.', async () => {
        const existingLabel = labels[0];

        const dto: CreateLabelDto = plainToInstance(CreateLabelDto, {
            imageUrl: `${P}-colliding-label.png`,
            menuItemId: existingLabel.menuItem.id,
            labelTypeId: existingLabel.labelType.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['labelType']),
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const labelToUpdate = labels[0];

        // singleItems[1] with labelTypes[2] is unused
        const dto: UpdateLabelDto = plainToInstance(UpdateLabelDto, {
            imageUrl: `${P}-updated-label.png`,
            menuItemId: singleItems[1].id,
            labelTypeId: labelTypes[2].id,
        });

        const errors = await validator.validateDto(dto, labelToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: labelType and menuItem already exists for this item.', async () => {
        const labelToUpdate = labels[0];
        const existingLabel = labels[1];

        const dto: UpdateLabelDto = plainToInstance(UpdateLabelDto, {
            menuItemId: existingLabel.menuItem.id,
            labelTypeId: existingLabel.labelType.id,
            imageUrl: labelToUpdate.imageUrl,
        });

        const errors = await validator.validateDto(dto, labelToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['labelType']),
        );
    });
});
