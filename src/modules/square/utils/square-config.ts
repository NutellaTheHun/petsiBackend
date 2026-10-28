import { SquareEnvironment } from 'square';

/** Pinned so a dependency bump can't silently change response shapes. */
export const SQUARE_API_VERSION = '2026-09-16';

/** Read-only scopes. Adding one forces every tenant to re-authorize. */
export const SQUARE_OAUTH_SCOPES = [
    'ORDERS_READ',
    'ITEMS_READ',
    'MERCHANT_PROFILE_READ',
] as const;

/** App-level configuration keys, read through `ConfigService`. */
export const SQUARE_CONFIG_KEYS = {
    TOKEN_ENCRYPTION_KEY: 'SQUARE_TOKEN_ENCRYPTION_KEY',
} as const;

/**
 * Production only when `NODE_ENV === 'production'`, so dev and test can never
 * reach production data (same rule as the DB config).
 */
export function selectSquareEnvironment(
    nodeEnv: string | undefined,
): SquareEnvironment {
    return nodeEnv === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox;
}
