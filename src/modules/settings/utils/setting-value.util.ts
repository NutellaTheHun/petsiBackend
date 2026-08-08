import { SettingValueType } from '../entities/setting.entity';

export type SettingValue = string | number | boolean | Record<string, any> | any[];

/**
 * `Setting.value` is always persisted as text. These helpers are the only
 * place that should serialize/parse it — business logic elsewhere reads
 * settings through `SettingsService`'s typed accessors instead.
 */
export function serializeSettingValue(valueType: SettingValueType, value: SettingValue): string {
    switch (valueType) {
        case SettingValueType.String:
            return value as string;
        case SettingValueType.Number:
        case SettingValueType.Boolean:
            return String(value);
        case SettingValueType.Json:
            return JSON.stringify(value);
    }
}

export function deserializeSettingValue(valueType: SettingValueType, raw: string): SettingValue {
    switch (valueType) {
        case SettingValueType.String:
            return raw;
        case SettingValueType.Number:
            return Number(raw);
        case SettingValueType.Boolean:
            return raw === 'true';
        case SettingValueType.Json:
            return JSON.parse(raw);
    }
}

export function matchesSettingValueType(valueType: SettingValueType, value: unknown): boolean {
    switch (valueType) {
        case SettingValueType.String:
            return typeof value === 'string';
        case SettingValueType.Number:
            return typeof value === 'number' && Number.isFinite(value);
        case SettingValueType.Boolean:
            return typeof value === 'boolean';
        case SettingValueType.Json:
            return typeof value === 'object' && value !== null;
    }
}
