import { ApiProperty } from '@nestjs/swagger';
import { SettingValueType } from '../entities/setting.entity';
import { SettingValue } from '../utils/setting-value.util';

/**
 * One entry in the merged tenant-default + location-override view returned
 * by `SettingsService.getEffectiveSettings` — the single-call shape a
 * frontend or audit view consumes instead of resolving fallback per key.
 */
export class EffectiveSettingDto {
    @ApiProperty({ example: 'taxRate' })
    readonly name: string;

    @ApiProperty({ enum: SettingValueType })
    readonly valueType: SettingValueType;

    @ApiProperty({ example: 0.08 })
    readonly value: SettingValue;

    @ApiProperty({
        description: 'True if this value comes from a location-specific override rather than the tenant default.',
        example: false,
    })
    readonly isOverridden: boolean;
}
