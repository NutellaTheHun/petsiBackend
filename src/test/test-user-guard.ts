import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/PublicLogin';
import { AppRequest } from '../modules/auth/utils/jwt-payload';
import {
    Feature,
    FEATURE_REGISTRY,
} from '../modules/feature-flags/utils/feature.registry';
import { TestRequestContextService } from './mocks/test-request-context.service';

const ALL_FEATURES = Object.keys(FEATURE_REGISTRY) as Feature[];

/** The JWT payload fields the global guards and the scoped services read. */
export interface TestUser {
    tenantId: number;
    isTenantAdmin: boolean;
    locations: { locationId: number; roles: string[] }[];
    /** Omitted: every registered feature. Set it to test `FeatureGuard` denial. */
    features?: Feature[];
}

/**
 * Stands in for `AuthGuard` in HTTP specs: `@Public()` routes pass untouched;
 * otherwise the spec's current user is attached as `req.user` (what
 * `RoleGuard`/`FeatureGuard` read) and mirrored into the request context (what
 * the services read), the way the real `AuthGuard` does. With no user the
 * request is rejected 401, like a request without a token.
 */
@Injectable()
export class TestUserGuard implements CanActivate {
    constructor(
        private readonly getUser: (() => TestUser | undefined) | undefined,
        private readonly requestContext: TestRequestContextService,
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) {
            return true;
        }
        const user = this.getUser?.();
        if (!user) {
            throw new UnauthorizedException();
        }
        context.switchToHttp().getRequest<AppRequest>().user = {
            ...user,
            features: user.features ?? ALL_FEATURES,
        };
        this.requestContext.setContext(user);
        return true;
    }
}
