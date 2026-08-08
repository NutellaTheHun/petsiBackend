import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SettingValueType } from '../entities/setting.entity';
import { SettingValue, serializeSettingValue } from './setting-value.util';

@Injectable()
export class SettingTestUtil {
    constructor(
        @InjectRepository(Setting)
        private readonly settingRepo: Repository<Setting>,
    ) {}

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedSetting(
        tenantId: number,
        name: string,
        valueType: SettingValueType,
        value: SettingValue,
        locationId: number | null = null,
    ): Promise<Setting> {
        const entity = this.settingRepo.create({
            tenantId,
            locationId,
            name,
            valueType,
            value: serializeSettingValue(valueType, value),
        });
        return await this.settingRepo.save(entity);
    }
}
