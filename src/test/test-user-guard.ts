import {
    CanActivate,
    ExecutionContext,
    INestApplication,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRequest } from '../modules/auth/utils/jwt-payload';
import { RoleGuard } from '../modules/roles/guards/role.guard';
import { TestRequestContextService } from './mocks/test-request-context.service';

/** The JWT payload fields `RoleGuard` and the scoped services read. */
export interface TestUser {
    tenantId: number;
    isTenantAdmin: boolean;
    locations: { locationId: number; roles: string[] }[];
}

/**
 * Stands in for `AuthGuard` in HTTP specs: attaches the spec's current user as
 * `req.user` (what `RoleGuard` reads) and mirrors it into the request context
 * (what the services read), the way the real `AuthGuard` does.
 */
@Injectable()
export class TestUserGuard implements CanActivate {
    constructor(
        private readonly getUser: () => TestUser,
        private readonly requestContext: TestRequestContextService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const user = this.getUser();
        context.switchToHttp().getRequest<AppRequest>().user = user;
        this.requestContext.setContext(user);
        return true;
    }
}

/**
 * `beforeInit` hook for `createHttpTestApp`: registers `TestUserGuard` and the
 * real `RoleGuard`, in the same order as `AppModule`'s `APP_GUARD`s.
 */
export function useTestUserAndRoleGuards(
    getUser: () => TestUser,
    requestContext: TestRequestContextService,
): (app: INestApplication) => void {
    return (app) =>
        app.useGlobalGuards(
            new TestUserGuard(getUser, requestContext),
            new RoleGuard(new Reflector()),
        );
}
