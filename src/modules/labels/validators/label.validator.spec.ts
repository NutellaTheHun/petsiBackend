import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { url_red } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelValidator } from './label.validator';

describe('label validator', () => {
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: LabelValidator;
    let labelRepo: Repository<Label>;
    let labelTypeRepo: Repository<LabelType>;
    let itemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        await testingUtil.initLabelTestDatabase(dbTestContext);

        validator = module.get<LabelValidator>(LabelValidator);

        labelRepo = module.get(getRepositoryToken(Label));
        labelTypeRepo = module.get(getRepositoryToken(LabelType));
        itemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create with no validation errors', async () => {
        const labelTypes = await labelTypeRepo.find();
        if (labelTypes.length === 0) {
            throw new Error('label types not found');
        }
        const menuItems = await itemRepo.find();
        if (menuItems.length === 0) {
            throw new Error('menu items not found');
        }

        // Find a combination that doesn't exist
        const existingLabels = await labelRepo.find({
            relations: ['menuItem', 'labelType'],
        });
        const existingCombinations = new Set(
            existingLabels.map((l) => `${l.menuItem.id}-${l.labelType.id}`),
        );

        let menuItem = menuItems[0];
        let labelType = labelTypes[0];
        for (const item of menuItems) {
            for (const type of labelTypes) {
                if (!existingCombinations.has(`${item.id}-${type.id}`)) {
                    menuItem = item;
                    labelType = type;
                    break;
                }
            }
            if (!existingCombinations.has(`${menuItem.id}-${labelType.id}`)) {
                break;
            }
        }

        const dto: CreateLabelDto = plainToInstance(CreateLabelDto, {
            imageUrl: url_red,
            menuItemId: menuItem.id,
            labelTypeId: labelType.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: labelType and menuItemalready exists for this item.', async () => {
        const existingLabel = await labelRepo.findOne({
            where: {},
            relations: ['menuItem', 'labelType'],
        });
        if (!existingLabel) {
            throw new Error('existing label not found');
        }

        const dto: CreateLabelDto = plainToInstance(CreateLabelDto, {
            imageUrl: url_red,
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
        const labelToUpdate = await labelRepo.findOne({
            where: {},
            relations: ['menuItem', 'labelType'],
        });
        if (!labelToUpdate) {
            throw new Error('label not found');
        }

        const menuItems = await itemRepo.find();
        if (menuItems.length === 0) {
            throw new Error('menu items not found');
        }
        let newMenuItem = menuItems[0]

        const labelTypes = await labelTypeRepo.find();
        if (labelTypes.length === 0) {
            throw new Error('label types not found');
        }
        let newLabelType = labelTypes[0];

        for (const item of menuItems) {
            let exists: Label | null = null;
            for (const type of labelTypes) {
                exists = await labelRepo.findOne({
                    where: {
                        menuItem: { id: newMenuItem.id },
                        labelType: { id: newLabelType.id },
                    },
                });
                if (!exists) {
                    newMenuItem = item;
                    newLabelType = type;
                    break;
                }
            }
            if (!exists) {
                break;
            }
        }

        const dto: UpdateLabelDto = plainToInstance(UpdateLabelDto, {
            imageUrl: 'new-url',
            menuItemId: newMenuItem.id,
            labelTypeId: newLabelType.id,
        });

        const errors = await validator.validateDto(dto, labelToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: labelType and menuItem already exists for this item.', async () => {
        const labels = await labelRepo.find({
            relations: ['menuItem', 'labelType'],
        });
        if (labels.length < 2) {
            throw new Error('Not enough labels for test');
        }

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
