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
    APPLICATION_ID: 'SQUARE_APPLICATION_ID',
    APPLICATION_SECRET: 'SQUARE_APPLICATION_SECRET',
    /** The backend's OAuth callback URL, exactly as registered with Square. */
    OAUTH_REDIRECT_URL: 'SQUARE_OAUTH_REDIRECT_URL',
    /** The frontend settings page the OAuth callback sends the browser back to. */
    SETTINGS_URL: 'SQUARE_SETTINGS_URL',
} as const;

/**
 * Square's OAuth authorize URL for the app. `session=false` is production
 * only: Sandbox doesn't support it.
 */
export function buildSquareAuthorizeUrl(
    nodeEnv: string | undefined,
    clientId: string,
    state: string,
): string {
    const isProduction = nodeEnv === 'production';
    const base = isProduction
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com';
    const params = new URLSearchParams({ client_id: clientId, state });
    if (isProduction) {
        params.set('session', 'false');
    }
    // Square separates scopes with a literal `+`, which URLSearchParams would encode
    return `${base}/oauth2/authorize?${params.toString()}&scope=${SQUARE_OAUTH_SCOPES.join('+')}`;
}

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
