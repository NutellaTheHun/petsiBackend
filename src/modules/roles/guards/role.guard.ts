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

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
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

    const locationScope = this.reflector.getAllAndOverride<LocationScopeMetadata>(
      LOCATION_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (locationScope) {
      const targetLocationId = this.extractLocationId(context, locationScope);
      if (targetLocationId == null) {
        return false;
      }
      const claim = locations.find((l) => l.locationId === targetLocationId);
      return !!claim && requiredRoles.some((role) => claim.roles.includes(role));
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
