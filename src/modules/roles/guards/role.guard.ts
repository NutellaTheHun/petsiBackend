import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  LOCATION_SCOPE_KEY,
  LocationScopeMetadata,
} from '../../../common/decorators/LocationScope';
import { ROLES_KEY } from '../../../common/decorators/PublicRole';

interface LocationClaim {
  locationId: number;
  roles: string[];
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * `@Roles` alone: the caller must hold one of the roles at any of their
   * locations. `@LocationScope` (with or without `@Roles`): the caller must
   * be assigned to the target location, and hold one of the roles there if
   * any are required. A target locationId that can't be resolved from the
   * request is denied. Tenant admins pass both checks.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const locationScope = this.reflector.getAllAndOverride<LocationScopeMetadata>(
      LOCATION_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles.length === 0 && !locationScope) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }
    if (user.isTenantAdmin === true) {
      return true;
    }

    const locations: LocationClaim[] = Array.isArray(user.locations)
      ? user.locations
      : [];

    if (locationScope) {
      const targetLocationId = this.extractLocationId(context, locationScope);
      if (targetLocationId == null) {
        return false;
      }
      const claim = locations.find((l) => l.locationId === targetLocationId);
      if (!claim) {
        return false;
      }
      return (
        requiredRoles.length === 0 ||
        requiredRoles.some((role) => claim.roles.includes(role))
      );
    }

    return locations.some((l) =>
      requiredRoles.some((role) => l.roles.includes(role)),
    );
  }

  private extractLocationId(
    context: ExecutionContext,
    scope: LocationScopeMetadata,
  ): number | undefined {
    const request = context.switchToHttp().getRequest();
    const raw = request[scope.source]?.[scope.key];
    if (raw == null) {
      return undefined;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
