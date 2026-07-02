import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemSizeValidator } from './menu-item-size.validator';

const P = `t${Date.now()}`;

describe('menu item size validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let validator: MenuItemSizeValidator;
    let sizeRepo: Repository<MenuItemSize>;

    let sizes: MenuItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        validator = module.get<MenuItemSizeValidator>(MenuItemSizeValidator);
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ sizes } = await testingUtil.seedSizes(P));
    });

    afterAll(async () => {
        await sizeRepo.delete(sizes.map((s) => s.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateMenuItemSizeDto = plainToInstance(CreateMenuItemSizeDto, {
            name: `${P}-new-size`,
        });
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateMenuItemSizeDto = plainToInstance(CreateMenuItemSizeDto, {
            name: sizes[0].name,
        });
        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateMenuItemSizeDto = plainToInstance(UpdateMenuItemSizeDto, {
            name: `${P}-updated-name`,
        });
        const errors = await validator.validateDto(dto, sizes[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateMenuItemSizeDto = plainToInstance(UpdateMenuItemSizeDto, {
            name: sizes[1].name,
        });
        const errors = await validator.validateDto(dto, sizes[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
