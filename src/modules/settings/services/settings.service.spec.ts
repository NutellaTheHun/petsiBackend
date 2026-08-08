import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { Setting, SettingValueType } from '../entities/setting.entity';
import { SettingTestUtil } from '../utils/setting-test.util';
import { getSettingsTestingModule } from '../utils/settings-testing.module';
import { SettingsService } from './settings.service';

class TestableSettingsService extends SettingsService {
    async createEntityForTest(dto: CreateSettingDto, manager: EntityManager) {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(dto: UpdateSettingDto, entity: Setting, manager: EntityManager) {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('SettingsService', () => {
    let testingUtil: SettingTestUtil;
    let locationTestUtil: LocationTestUtil;
    let service: TestableSettingsService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let settingRepo: Repository<Setting>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;

    const setNormalContext = () =>
        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: locationA.id, roles: ['manager'] }],
        });

    const setTenantAdminContext = () =>
        requestContext.setContext({ tenantId: tenant.id, isTenantAdmin: true, locations: [] });

    beforeAll(async () => {
        const module: TestingModule = await getSettingsTestingModule({
            settingsServiceClass: TestableSettingsService,
        });
        testingUtil = module.get<SettingTestUtil>(SettingTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        service = module.get(SettingsService) as TestableSettingsService;
        dataSource = module.get(DataSource);
        settingRepo = module.get(getRepositoryToken(Setting));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA, locationB] } =
            await locationTestUtil.seedLocations(P, undefined, 2));

        setNormalContext();
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        setNormalContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('tenant default lifecycle', () => {
        let defaultSetting: Setting;

        it('createEntity stamps tenantId, valueType, and the serialized value', async () => {
            const dto = plainToInstance(CreateSettingDto, {
                name: 'taxRate',
                value: 0.08,
            });
            await dataSource.transaction(async (manager) => {
                defaultSetting = await service.createEntityForTest(dto, manager);
            });
            expect(defaultSetting.id).toBeDefined();
            expect(defaultSetting.tenantId).toBe(tenant.id);
            expect(defaultSetting.locationId).toBeNull();
            expect(defaultSetting.valueType).toBe(SettingValueType.Number);
            expect(defaultSetting.value).toBe('0.08');
        });

        it("updateEntity re-serializes the incoming value against the entity's valueType", async () => {
            const dto = plainToInstance(UpdateSettingDto, { value: 0.0925 });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, defaultSetting, manager);
            });
            const reloaded = await settingRepo.findOneOrFail({ where: { id: defaultSetting.id } });
            expect(reloaded.value).toBe('0.0925');
        });

        it('should remove the tenant default', async () => {
            setTenantAdminContext();
            await service.remove(defaultSetting.id);
            await expect(service.findOne(defaultSetting.id)).rejects.toThrow(NotFoundException);
        });
    });

    describe('change detector on update', () => {
        let setting: Setting;
        let spy: jest.SpyInstance;

        beforeAll(async () => {
            setTenantAdminContext();
            setting = (await service.create(
                plainToInstance(CreateSettingDto, { name: 'defaultTimezone', value: 'UTC' }),
            )) as Setting;
        });

        afterAll(async () => {
            await settingRepo.delete(setting.id);
        });

        beforeEach(() => {
            setTenantAdminContext();
            spy = jest.spyOn(SettingsService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when the incoming value serializes the same as the stored value', async () => {
            const result = await service.update(
                setting.id,
                plainToInstance(UpdateSettingDto, { value: 'UTC' }),
            );
            expect(result.value).toBe('UTC');
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when the value changes', async () => {
            await service.update(
                setting.id,
                plainToInstance(UpdateSettingDto, { value: 'America/Chicago' }),
            );
            expect(spy).toHaveBeenCalled();
            const row = await settingRepo.findOneOrFail({ where: { id: setting.id } });
            expect(row.value).toBe('America/Chicago');
        });
    });

    describe('registry validation propagates as ValidationException', () => {
        it('create rejects an unregistered setting key', async () => {
            setTenantAdminContext();
            await expect(
                service.create(plainToInstance(CreateSettingDto, { name: `${P}-bogus`, value: 'x' })),
            ).rejects.toThrow(ValidationException);
        });

        it('create rejects a value of the wrong type for a registered key', async () => {
            setTenantAdminContext();
            await expect(
                service.create(
                    plainToInstance(CreateSettingDto, { name: 'taxRate', value: 'not-a-number' }),
                ),
            ).rejects.toThrow(ValidationException);
        });
    });

    describe('tenant/location authorization', () => {
        it('create throws ForbiddenException for a non-admin writing a tenant default (no locationId)', async () => {
            await expect(
                service.create(
                    plainToInstance(CreateSettingDto, { name: 'orderNumberPrefix', value: 'ORD-' }),
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('create throws ForbiddenException for a locationId the caller is not assigned to', async () => {
            await expect(
                service.create(
                    plainToInstance(CreateSettingDto, {
                        name: 'orderNumberPrefix',
                        locationId: locationB.id,
                        value: 'ORD-',
                    }),
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('a manager can create a location override at their own location', async () => {
            const created = (await service.create(
                plainToInstance(CreateSettingDto, {
                    name: 'orderNumberPrefix',
                    locationId: locationA.id,
                    value: 'A-',
                }),
            )) as Setting;
            expect(created.tenantId).toBe(tenant.id);
            expect(created.locationId).toBe(locationA.id);
            await settingRepo.delete(created.id);
        });
    });

    describe('tenant-default rows are only visible via raw findOne to tenant admins', () => {
        let row: Setting;

        beforeAll(async () => {
            row = await testingUtil.seedSetting(
                tenant.id,
                'orderNumberPrefix',
                SettingValueType.String,
                'X-',
            );
        });

        afterAll(async () => {
            await settingRepo.delete(row.id);
        });

        it('findOne throws NotFoundException for a non-admin caller', async () => {
            await expect(service.findOne(row.id)).rejects.toThrow(NotFoundException);
        });

        it('findOne succeeds for a tenant admin caller', async () => {
            setTenantAdminContext();
            const result = await service.findOne(row.id);
            expect(result.id).toBe(row.id);
        });
    });

    describe('typed accessor resolution', () => {
        let tenantDefault: Setting;
        let locationOverride: Setting;

        beforeAll(async () => {
            tenantDefault = await testingUtil.seedSetting(
                tenant.id,
                'taxRate',
                SettingValueType.Number,
                0.05,
            );
            locationOverride = await testingUtil.seedSetting(
                tenant.id,
                'taxRate',
                SettingValueType.Number,
                0.09,
                locationA.id,
            );
        });

        afterAll(async () => {
            await settingRepo.delete([tenantDefault.id, locationOverride.id]);
        });

        it('falls back to the tenant default when no location override exists', async () => {
            const value = await service.getNumber('taxRate', locationB.id);
            expect(value).toBe(0.05);
        });

        it('prefers the location override over the tenant default', async () => {
            const value = await service.getNumber('taxRate', locationA.id);
            expect(value).toBe(0.09);
        });

        it('resolves the tenant default when no locationId is supplied', async () => {
            const value = await service.getNumber('taxRate');
            expect(value).toBe(0.05);
        });

        it('throws for an unregistered key', async () => {
            await expect(service.getString(`${P}-bogus`)).rejects.toThrow();
        });

        it('throws when called with an accessor that does not match the registered type', async () => {
            await expect(service.getBoolean('taxRate')).rejects.toThrow();
        });

        it('throws NotFoundException when no row exists at any level', async () => {
            await expect(service.getString('orderNumberPrefix')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getEffectiveSettings', () => {
        let tzDefault: Setting;
        let prefixDefault: Setting;
        let tzOverrideAtA: Setting;

        beforeAll(async () => {
            tzDefault = await testingUtil.seedSetting(
                tenant.id,
                'defaultTimezone',
                SettingValueType.String,
                'UTC',
            );
            prefixDefault = await testingUtil.seedSetting(
                tenant.id,
                'orderNumberPrefix',
                SettingValueType.String,
                'ORD-',
            );
            tzOverrideAtA = await testingUtil.seedSetting(
                tenant.id,
                'defaultTimezone',
                SettingValueType.String,
                'America/New_York',
                locationA.id,
            );
        });

        afterAll(async () => {
            await settingRepo.delete([tzDefault.id, prefixDefault.id, tzOverrideAtA.id]);
        });

        it('includes a tenant default with no override applied when the caller has none at their location', async () => {
            const result = await service.getEffectiveSettings(locationA.id);
            const prefix = result.find((r) => r.name === 'orderNumberPrefix');
            expect(prefix?.value).toBe('ORD-');
            expect(prefix?.isOverridden).toBe(false);
        });

        it('applies the location override on top of the tenant default', async () => {
            const result = await service.getEffectiveSettings(locationA.id);
            const tz = result.find((r) => r.name === 'defaultTimezone');
            expect(tz?.value).toBe('America/New_York');
            expect(tz?.isOverridden).toBe(true);
        });

        it('throws ForbiddenException for a location the caller is not authorized for', async () => {
            await expect(service.getEffectiveSettings(locationB.id)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('a tenant admin can read tenant defaults with no locationId, or any location', async () => {
            setTenantAdminContext();
            const tenantWide = await service.getEffectiveSettings();
            expect(tenantWide.find((r) => r.name === 'defaultTimezone')?.value).toBe('UTC');

            const atB = await service.getEffectiveSettings(locationB.id);
            const tzAtB = atB.find((r) => r.name === 'defaultTimezone');
            expect(tzAtB?.value).toBe('UTC');
            expect(tzAtB?.isOverridden).toBe(false);
        });
    });
});
