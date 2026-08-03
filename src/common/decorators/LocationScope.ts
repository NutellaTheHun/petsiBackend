import { SetMetadata } from '@nestjs/common';

export const LOCATION_SCOPE_KEY = 'locationScope';

export type LocationParamSource = 'params' | 'query' | 'body';

export interface LocationScopeMetadata {
  source: LocationParamSource;
  key: string;
}

/**
 * Marks a route as acting on a specific location, so `RoleGuard` checks the
 * required role(s) against that `locationId` specifically instead of "any of
 * the caller's locations" (the default, tenant-wide check). `source`/`key`
 * tell the guard where to read the target `locationId` from on the inbound
 * request — a route param, a query param, or a DTO field on the body —
 * since that varies per route and isn't dictated by this decorator.
 */
export const LocationScope = (source: LocationParamSource, key = 'locationId') =>
  SetMetadata(LOCATION_SCOPE_KEY, { source, key } as LocationScopeMetadata);
