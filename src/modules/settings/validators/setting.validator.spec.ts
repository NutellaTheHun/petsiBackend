import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { Setting, SettingValueType } from '../entities/setting.entity';
import { getSettingsTestingModule } from '../utils/settings-testing.module';
import { SettingTestUtil } from '../utils/setting-test.util';
import { SettingValidator } from './setting.validator';

const P = `t${Date.now()}`;

describe('setting validator', () => {
    let testingUtil: SettingTestUtil;
    let locationTestUtil: LocationTestUtil;
    let testCtx: DatabaseTestContext;
    let requestContext: TestRequestContextService;

    let validator: SettingValidator;
    let settingRepo: Repository<Setting>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let locationA: Location;
    let existingDefault: Setting;

    beforeAll(async () => {
        const module: TestingModule = await getSettingsTestingModule();
        testingUtil = module.get<SettingTestUtil>(SettingTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        validator = module.get<SettingValidator>(SettingValidator);
        settingRepo = module.get(getRepositoryToken(Setting));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA] } = await locationTestUtil.seedLocations(P, undefined, 1));
        requestContext.setContext({ tenantId: tenant.id });

        existingDefault = await testingUtil.seedSetting(
            tenant.id,
            'taxRate',
            SettingValueType.Number,
            0.08,
        );
    });

    afterAll(async () => {
        await settingRepo.delete(existingDefault.id);
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('successfully validate create: no validation errors', async () => {
        const dto = plainToInstance(CreateSettingDto, {
            name: 'orderNumberPrefix',
            value: 'ORD-',
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: unregistered setting key', async () => {
        const dto = plainToInstance(CreateSettingDto, {
            name: `${P}-not-a-real-key`,
            value: 'anything',
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['name']),
        );
    });

    it('fail validate create: value type does not match the registry', async () => {
        const dto = plainToInstance(CreateSettingDto, {
            name: 'orderNumberPrefix',
            value: 12345,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['value']),
        );
    });

    it('fail validate create: tenant default already exists for this key', async () => {
        const dto = plainToInstance(CreateSettingDto, {
            name: 'taxRate',
            value: 0.09,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('allows a location override for a key that already has a tenant default', async () => {
        const dto = plainToInstance(CreateSettingDto, {
            name: 'taxRate',
            locationId: locationA.id,
            value: 0.1,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('successfully validate update: value matches the existing key\'s registered type', async () => {
        const dto = plainToInstance(UpdateSettingDto, { value: 0.11 });

        const errors = await validator.validateDto(dto, existingDefault.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: value type does not match the existing key\'s registered type', async () => {
        const dto = plainToInstance(UpdateSettingDto, { value: 'not-a-number' });

        const errors = await validator.validateDto(dto, existingDefault.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['value']),
        );
    });
});
