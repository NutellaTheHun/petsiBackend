import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from '../../../common/decorators/RequiresFeature';
import { Feature } from '../utils/feature.registry';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeatures = this.reflector.getAllAndOverride<Feature[]>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // A missing `features` claim (a pre-existing JWT, or any other cause) is
    // treated identically to `features: []` — denied on any
    // @RequiresFeature()-guarded route. This is fail-closed on purpose: do
    // not "fix" this to skip the check when the claim is absent.
    const userFeatures: Feature[] = Array.isArray(user?.features) ? user.features : [];

    return requiredFeatures.some((feature) => userFeatures.includes(feature));
  }
}
