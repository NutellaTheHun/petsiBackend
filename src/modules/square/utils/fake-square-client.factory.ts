import { Injectable } from '@nestjs/common';
import { SquareAppApi, SquareTenantApi } from '../client/square-api';
import { SquareClientFactory } from '../client/square-client.factory';

function notStubbed(method: string): () => Promise<never> {
    return () =>
        Promise.reject(
            new Error(`FakeSquareClientFactory: ${method} is not stubbed`),
        );
}

/** A tenant API whose every method rejects until a spec assigns a fixture. */
export function unstubbedTenantApi(): SquareTenantApi {
    return {
        orders: {
            get: notStubbed('orders.get'),
            batchGet: notStubbed('orders.batchGet'),
            search: notStubbed('orders.search'),
        },
        catalog: {
            search: notStubbed('catalog.search'),
            batchGet: notStubbed('catalog.batchGet'),
            object: { get: notStubbed('catalog.object.get') },
        },
        locations: {
            list: notStubbed('locations.list'),
            get: notStubbed('locations.get'),
        },
        merchants: { get: notStubbed('merchants.get') },
    };
}

export function unstubbedAppApi(): SquareAppApi {
    return {
        oAuth: {
            obtainToken: notStubbed('oAuth.obtainToken'),
            revokeToken: notStubbed('oAuth.revokeToken'),
        },
    };
}

/**
 * Test double for `SquareClientFactory`. The connection-status check and token
 * decryption are inherited; only client construction is replaced. Specs assign
 * typed `Square.*` fixtures to `tenantApi` / `appApi` methods, and can read the
 * decrypted tokens the factory was asked to use.
 */
@Injectable()
export class FakeSquareClientFactory extends SquareClientFactory {
    tenantApi: SquareTenantApi = unstubbedTenantApi();
    appApi: SquareAppApi = unstubbedAppApi();
    readonly tenantAccessTokens: string[] = [];

    reset(): void {
        this.tenantApi = unstubbedTenantApi();
        this.appApi = unstubbedAppApi();
        this.tenantAccessTokens.length = 0;
    }

    protected createTenantClient(accessToken: string): SquareTenantApi {
        this.tenantAccessTokens.push(accessToken);
        return this.tenantApi;
    }

    protected createAppClient(): SquareAppApi {
        return this.appApi;
    }
}
