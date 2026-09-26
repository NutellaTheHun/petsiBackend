import { Feature } from './feature.registry';

export interface UserRoleIdsByLocation {
    locationId: number;
    roleIds: number[];
}

export interface ComputeEffectiveFeaturesInput {
    tenantEnabledFeatures: Feature[];
    roleGrantsByRoleId: Map<number, Feature[]>;
    userRoleIdsByLocation: UserRoleIdsByLocation[];
    isTenantAdmin: boolean;
}

/**
 * Tenant-enabled features intersected with the union of whatever every role
 * the user holds (across every location) grants. A tenant admin bypasses the
 * role half of the intersection entirely. No row anywhere (tenant or role)
 * contributes anything — deny-by-default is structural to the inputs, not a
 * special case here.
 */
export function computeEffectiveFeatures(input: ComputeEffectiveFeaturesInput): Feature[] {
    const { tenantEnabledFeatures, roleGrantsByRoleId, userRoleIdsByLocation, isTenantAdmin } = input;

    if (isTenantAdmin) {
        return [...tenantEnabledFeatures];
    }

    const grantedUnion = new Set<Feature>();
    for (const { roleIds } of userRoleIdsByLocation) {
        for (const roleId of roleIds) {
            const grants = roleGrantsByRoleId.get(roleId) ?? [];
            for (const feature of grants) {
                grantedUnion.add(feature);
            }
        }
    }

    return tenantEnabledFeatures.filter((feature) => grantedUnion.has(feature));
}
