import { Request } from 'express';
import type { Feature } from '../../feature-flags/utils/feature.registry';
import type { Tenant } from '../../tenants/entities/tenant.entity';

export interface LocationClaim {
    locationId: number;
    roles: string[];
}

/**
 * Claims `AuthService.signIn` signs into the access token. Every field is
 * optional because tokens issued before a claim existed lack it, so readers
 * check each claim before trusting it.
 */
export interface JwtPayload {
    sub?: number;
    username?: string;
    tenantId?: number;
    isTenantAdmin?: boolean;
    locations?: LocationClaim[];
    features?: Feature[];
}

/**
 * An Express request after `TenantResolutionMiddleware` (which sets `tenant`
 * or rejects the request) and `AuthGuard` (which sets `user` on non-public routes) have run.
 */
export type AppRequest = Request & { user?: JwtPayload; tenant: Tenant };
