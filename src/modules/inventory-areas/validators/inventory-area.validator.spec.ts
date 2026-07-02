import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaValidator } from './inventory-area.validator';

const P = `t${Date.now()}`;

describe('inventory area validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: InventoryAreaValidator;
    let areaRepo: Repository<InventoryArea>;

    let areas: InventoryArea[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        validator = module.get<InventoryAreaValidator>(InventoryAreaValidator);
        areaRepo = module.get(getRepositoryToken(InventoryArea));

        ({ areas } = await testingUtil.seedAreas(P));
    });

    afterAll(async () => {
        await areaRepo.delete(areas.map((a) => a.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateInventoryAreaDto = plainToInstance(CreateInventoryAreaDto, {
            name: `${P}-new-area`,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryAreaDto = plainToInstance(CreateInventoryAreaDto, {
            name: areas[0].name,
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
        const dto: UpdateInventoryAreaDto = plainToInstance(UpdateInventoryAreaDto, {
            name: `${P}-updated-area`,
        });

        const errors = await validator.validateDto(dto, areas[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateInventoryAreaDto = plainToInstance(UpdateInventoryAreaDto, {
            name: areas[1].name,
        });

        const errors = await validator.validateDto(dto, areas[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
