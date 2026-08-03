import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { LocationScopedServiceBase } from '../../../common/base/location-scoped-service.base';
import { AppHttpException } from '../../../common/exceptions/app-http-exception';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { EffectiveSettingDto } from '../dto/effective-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { Setting, SettingEntity, SettingValueType } from '../entities/setting.entity';
import { getRegisteredValueType, isRegisteredSettingKey } from '../utils/setting-key.registry';
import { deserializeSettingValue, serializeSettingValue } from '../utils/setting-value.util';
import { SettingChangeDetector } from '../utils/change-detectors/setting.change-detector';
import { SettingValidator } from '../validators/setting.validator';

@Injectable()
export class SettingsService extends LocationScopedServiceBase<SettingEntity> {
    constructor(
        @InjectRepository(Setting) repo: Repository<Setting>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: SettingValidator,
        private readonly settingChangeDetector: SettingChangeDetector,
    ) {
        super(repo, 'SettingsService', requestContextService, logger, validator);
    }

    protected async createEntity(dto: CreateSettingDto, manager: EntityManager): Promise<Setting> {
        const valueType = getRegisteredValueType(dto.name)!;
        const result = manager.create(Setting, {
            tenantId: this.getTenantId(),
            locationId: dto.locationId ?? null,
            name: dto.name,
            valueType,
            value: serializeSettingValue(valueType, dto.value),
        });
        return await manager.save(result);
    }

    protected async updateEntity(
        dto: UpdateSettingDto,
        manager: EntityManager,
        entity: Setting,
    ): Promise<void> {
        if (dto.value !== undefined) {
            entity.value = serializeSettingValue(entity.valueType, dto.value);
        }
        await manager.save(entity);
    }

    protected getChangeDetector() {
        return this.settingChangeDetector;
    }

    /**
     * Typed accessors — the only sanctioned way for other backend code to
     * read a setting's value. They resolve the effective value (location
     * override, falling back to the tenant default) for whatever
     * `(tenantId, locationId)` the caller supplies, and are trusted internal
     * calls: unlike `getEffectiveSettings`, they do not re-check the
     * *current request's* location authorization, since callers may resolve
     * settings for a locationId that isn't the acting user's own (e.g. an
     * order's location during background processing).
     */
    async getString(name: string, locationId?: number): Promise<string> {
        return (await this.getTypedValue(name, SettingValueType.String, locationId)) as string;
    }

    async getNumber(name: string, locationId?: number): Promise<number> {
        return (await this.getTypedValue(name, SettingValueType.Number, locationId)) as number;
    }

    async getBoolean(name: string, locationId?: number): Promise<boolean> {
        return (await this.getTypedValue(name, SettingValueType.Boolean, locationId)) as boolean;
    }

    async getJson<T = any>(name: string, locationId?: number): Promise<T> {
        return (await this.getTypedValue(name, SettingValueType.Json, locationId)) as T;
    }

    /**
     * Full effective settings list (tenant defaults, with any location
     * override applied on top) for one HTTP call — powers the frontend
     * "current settings" fetch and the tenant-admin audit view. Unlike the
     * typed accessors, this resolves against the *caller's* authorization:
     * a non-tenant-admin caller may only request their own assigned
     * locations.
     */
    async getEffectiveSettings(locationId?: number): Promise<EffectiveSettingDto[]> {
        if (locationId != null) {
            this.assertLocationAuthorized(locationId);
        }

        const tenantId = this.getTenantId();
        const defaults = await this.entityRepo.find({ where: { tenantId, locationId: IsNull() } });
        const overrides =
            locationId != null
                ? await this.entityRepo.find({ where: { tenantId, locationId } })
                : [];

        const overrideByName = new Map(overrides.map((o) => [o.name, o]));

        const merged: EffectiveSettingDto[] = defaults.map((def) => {
            const override = overrideByName.get(def.name);
            const source = override ?? def;
            return {
                name: source.name,
                valueType: source.valueType,
                value: deserializeSettingValue(source.valueType, source.value),
                isOverridden: !!override,
            };
        });

        for (const override of overrides) {
            if (!defaults.some((def) => def.name === override.name)) {
                merged.push({
                    name: override.name,
                    valueType: override.valueType,
                    value: deserializeSettingValue(override.valueType, override.value),
                    isOverridden: true,
                });
            }
        }

        return merged;
    }

    private async getTypedValue(
        name: string,
        expectedType: SettingValueType,
        locationId?: number,
    ): Promise<string | number | boolean | any> {
        if (!isRegisteredSettingKey(name)) {
            throw new AppHttpException(
                `Unregistered setting key: ${name}`,
                HttpStatus.BAD_REQUEST,
                'UNREGISTERED_SETTING_KEY',
            );
        }

        const registeredType = getRegisteredValueType(name);
        if (registeredType !== expectedType) {
            throw new AppHttpException(
                `Setting "${name}" is registered as ${registeredType}, not ${expectedType}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
                'SETTING_TYPE_MISMATCH',
            );
        }

        const row = await this.resolveEffectiveRow(name, locationId);
        if (!row) {
            throw new NotFoundException(`Setting "${name}" is not configured for this tenant`);
        }
        return deserializeSettingValue(row.valueType, row.value);
    }

    private async resolveEffectiveRow(name: string, locationId?: number): Promise<Setting | null> {
        const tenantId = this.getTenantId();

        if (locationId != null) {
            const override = await this.entityRepo.findOne({ where: { tenantId, locationId, name } });
            if (override) {
                return override;
            }
        }

        return this.entityRepo.findOne({ where: { tenantId, locationId: IsNull(), name } });
    }
}
