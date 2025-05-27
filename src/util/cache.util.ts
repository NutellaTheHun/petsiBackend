import { Cache } from "cache-manager";

/**
 * removes all keys for the specific service for findAll requests.
 */
export async function invalidateFindAllCache(servicePrefix: string, cacheManager: Cache): Promise<void> {
    const trackerKey = `${servicePrefix}-findAll-tracker`;
    const keys: string[] = await cacheManager.get<string[]>(trackerKey) ?? [];

    for (const key of keys) {
        await cacheManager.del(key);
    }

    await cacheManager.del(trackerKey);
}

/**
 * Adds the current findAll request key to a set of keys that are currently in the cache to facilitate invalidation per service.
 */
export async function trackFindAllKey(servicePrefix: string, cacheKey: string, cacheManager: Cache, ttl: number): Promise<void> {
    const trackerKey = `${servicePrefix}-findAll-tracker`;

    const existingKeys = await cacheManager.get<Set<string>>(trackerKey) ?? new Set<string>;

    existingKeys.add(cacheKey);

    await cacheManager.set(trackerKey, Array.from(existingKeys), ttl);
}