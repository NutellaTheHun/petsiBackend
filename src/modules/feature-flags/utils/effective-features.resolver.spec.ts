import { computeEffectiveFeatures, UserRoleIdsByLocation } from './effective-features.resolver';
import { Feature } from './feature.registry';

describe('computeEffectiveFeatures', () => {
    it('returns empty when tenant has no enabled features, regardless of role grants', () => {
        const result = computeEffectiveFeatures({
            tenantEnabledFeatures: [],
            roleGrantsByRoleId: new Map([[1, ['ORDER_MANAGEMENT']]]),
            userRoleIdsByLocation: [{ locationId: 1, roleIds: [1] }],
            isTenantAdmin: false,
        });
        expect(result).toEqual([]);
    });

    it('excludes a tenant feature that no role grants', () => {
        const result = computeEffectiveFeatures({
            tenantEnabledFeatures: ['ORDER_MANAGEMENT'],
            roleGrantsByRoleId: new Map([[1, ['RECIPE_MANAGEMENT']]]),
            userRoleIdsByLocation: [{ locationId: 1, roleIds: [1] }],
            isTenantAdmin: false,
        });
        expect(result).toEqual([]);
    });

    it('excludes a role-granted feature the tenant does not have (intersection, not role-side union)', () => {
        const result = computeEffectiveFeatures({
            tenantEnabledFeatures: ['ORDER_MANAGEMENT'],
            roleGrantsByRoleId: new Map([[1, ['ORDER_MANAGEMENT', 'RECIPE_MANAGEMENT']]]),
            userRoleIdsByLocation: [{ locationId: 1, roleIds: [1] }],
            isTenantAdmin: false,
        });
        expect(result).toEqual(['ORDER_MANAGEMENT']);
    });

    it('unions grants across two locations with different roles', () => {
        const roleGrantsByRoleId = new Map<number, Feature[]>([
            [1, ['ORDER_MANAGEMENT']],
            [2, ['RECIPE_MANAGEMENT']],
        ]);
        const userRoleIdsByLocation: UserRoleIdsByLocation[] = [
            { locationId: 1, roleIds: [1] },
            { locationId: 2, roleIds: [2] },
        ];

        const result = computeEffectiveFeatures({
            tenantEnabledFeatures: ['ORDER_MANAGEMENT', 'RECIPE_MANAGEMENT', 'LABEL_PRINTING'],
            roleGrantsByRoleId,
            userRoleIdsByLocation,
            isTenantAdmin: false,
        });

        expect(result.sort()).toEqual(['ORDER_MANAGEMENT', 'RECIPE_MANAGEMENT']);
    });

    it('bypasses role filtering entirely for a tenant admin', () => {
        const result = computeEffectiveFeatures({
            tenantEnabledFeatures: ['ORDER_MANAGEMENT', 'INVENTORY_MANAGEMENT'],
            roleGrantsByRoleId: new Map(),
            userRoleIdsByLocation: [],
            isTenantAdmin: true,
        });
        expect(result).toEqual(['ORDER_MANAGEMENT', 'INVENTORY_MANAGEMENT']);
    });

    it('returns empty when the user holds no roles at all', () => {
        const result = computeEffectiveFeatures({
            tenantEnabledFeatures: ['ORDER_MANAGEMENT'],
            roleGrantsByRoleId: new Map(),
            userRoleIdsByLocation: [],
            isTenantAdmin: false,
        });
        expect(result).toEqual([]);
    });
});
