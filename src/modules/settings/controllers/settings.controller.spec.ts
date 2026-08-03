import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { Setting, SettingValueType } from '../entities/setting.entity';
import { SettingTestUtil } from '../utils/setting-test.util';
import { getSettingsTestingModule } from '../utils/settings-testing.module';
import { SettingsController } from './settings.controller';

const P = `t${Date.now()}`;

describe('settings controller', () => {
    let testingUtil: SettingTestUtil;
    let locationTestUtil: LocationTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: SettingsController;
    let settingRepo: Repository<Setting>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;

    const managerAtLocationAContext = () => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId: locationA.id, roles: ['manager'] }],
    });

    beforeAll(async () => {
        const module: TestingModule = await getSettingsTestingModule();
        testingUtil = module.get<SettingTestUtil>(SettingTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        controller = module.get<SettingsController>(SettingsController);
        settingRepo = module.get(getRepositoryToken(Setting));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA, locationB] } =
            await locationTestUtil.seedLocations(P, undefined, 2));
        requestContext.setContext(managerAtLocationAContext());
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        requestContext.setContext(managerAtLocationAContext());
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('create throws ValidationException when the setting key is unregistered', async () => {
        const dto = plainToInstance(CreateSettingDto, {
            name: `${P}-bogus-key`,
            locationId: locationA.id,
            value: 'x',
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
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['name']),
            );
        }
    });

    it('remove deletes a created location override then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateSettingDto, {
                name: 'orderNumberPrefix',
                locationId: locationA.id,
                value: `${P}-`,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    describe('effective settings endpoint', () => {
        let tenantDefault: Setting;
        let locationOverride: Setting;

        beforeAll(async () => {
            tenantDefault = await testingUtil.seedSetting(
                tenant.id,
                'defaultTimezone',
                SettingValueType.String,
                'UTC',
            );
            locationOverride = await testingUtil.seedSetting(
                tenant.id,
                'defaultTimezone',
                SettingValueType.String,
                'America/New_York',
                locationA.id,
            );
        });

        afterAll(async () => {
            await settingRepo.delete([tenantDefault.id, locationOverride.id]);
        });

        it('returns the tenant default merged with the caller\'s location override in one call', async () => {
            const result = await controller.getEffective(locationA.id);
            const tz = result.find((r) => r.name === 'defaultTimezone');
            expect(tz?.value).toBe('America/New_York');
            expect(tz?.isOverridden).toBe(true);
        });

        it('throws ForbiddenException for a location the caller is not assigned to', async () => {
            await expect(controller.getEffective(locationB.id)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
