import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGuard } from './feature.guard';

function buildContext(user: any): ExecutionContext {
    const req = { user };
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
            getRequest: () => req,
        }),
    } as unknown as ExecutionContext;
}

describe('FeatureGuard', () => {
    let reflector: Reflector;
    let guard: FeatureGuard;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new FeatureGuard(reflector);
    });

    function mockMetadata(features: string[] | undefined) {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
            if (key === 'features') return features;
            return undefined;
        });
    }

    it('allows the request through when no features are required', () => {
        mockMetadata(undefined);
        const context = buildContext({ features: [] });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('denies the request when required features are present but the user has none', () => {
        mockMetadata(['ORDER_MANAGEMENT']);
        const context = buildContext({ features: undefined });
        expect(guard.canActivate(context)).toBe(false);
    });

    it('allows the request when one of several required features is present (OR)', () => {
        mockMetadata(['ORDER_MANAGEMENT', 'RECIPE_MANAGEMENT']);
        const context = buildContext({ features: ['RECIPE_MANAGEMENT'] });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('denies the request when none of the required features are present', () => {
        mockMetadata(['ORDER_MANAGEMENT', 'RECIPE_MANAGEMENT']);
        const context = buildContext({ features: ['LABEL_PRINTING'] });
        expect(guard.canActivate(context)).toBe(false);
    });
});
