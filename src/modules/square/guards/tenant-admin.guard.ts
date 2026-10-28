import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppRequest } from '../../auth/utils/jwt-payload';

/**
 * Passes only a caller whose JWT carries `isTenantAdmin: true`. `@Roles(admin)`
 * isn't enough for the Square connection: it also passes an admin of a single
 * location. Applied with `@UseGuards`, so it runs after the global guards
 * (a tenant without the feature gets the feature-flag 403 first).
 */
@Injectable()
export class TenantAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest<AppRequest>();
        return user?.isTenantAdmin === true;
    }
}
