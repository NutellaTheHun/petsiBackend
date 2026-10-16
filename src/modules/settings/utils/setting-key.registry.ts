import { SettingValueType } from '../entities/setting.entity';

/**
 * The exhaustive set of settings the backend understands. A write to any
 * `name` not listed here, or with a value that doesn't match the declared
 * `SettingValueType`, is rejected at the validator layer (see
 * `SettingValidator`) rather than failing silently at read time.
 */
export const SETTING_KEY_REGISTRY = {
    defaultTimezone: SettingValueType.String,
    taxRate: SettingValueType.Number,
    orderNumberPrefix: SettingValueType.String,
} satisfies Record<string, SettingValueType>;

export type SettingKey = keyof typeof SETTING_KEY_REGISTRY;

export function isRegisteredSettingKey(name: string): name is SettingKey {
    return Object.keys(SETTING_KEY_REGISTRY).includes(name);
}

export function getRegisteredValueType(
    name: string,
): SettingValueType | undefined {
    return isRegisteredSettingKey(name)
        ? SETTING_KEY_REGISTRY[name]
        : undefined;
}
