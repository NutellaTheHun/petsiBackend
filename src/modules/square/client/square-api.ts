import { Square, SquareClient } from 'square';

type OAuthRequestOptions = Parameters<SquareClient['oAuth']['revokeToken']>[1];

/**
 * The Square calls a tenant client may make: reads only. `SquareClient`
 * satisfies this structurally, so the real factory returns one directly, and a
 * test fake only has to implement these methods with plain Promises.
 * Add a read method here when a slice needs it; never a write.
 */
export interface SquareTenantApi {
    orders: {
        get(request: Square.GetOrdersRequest): Promise<Square.GetOrderResponse>;
        batchGet(
            request: Square.BatchGetOrdersRequest,
        ): Promise<Square.BatchGetOrdersResponse>;
        search(
            request: Square.SearchOrdersRequest,
        ): Promise<Square.SearchOrdersResponse>;
    };
    catalog: {
        search(
            request: Square.SearchCatalogObjectsRequest,
        ): Promise<Square.SearchCatalogObjectsResponse>;
        batchGet(
            request: Square.BatchGetCatalogObjectsRequest,
        ): Promise<Square.BatchGetCatalogObjectsResponse>;
        object: {
            get(
                request: Square.catalog.GetObjectRequest,
            ): Promise<Square.GetCatalogObjectResponse>;
        };
    };
    locations: {
        list(): Promise<Square.ListLocationsResponse>;
        get(
            request: Square.GetLocationsRequest,
        ): Promise<Square.GetLocationResponse>;
    };
    merchants: {
        get(
            request: Square.GetMerchantsRequest,
        ): Promise<Square.GetMerchantResponse>;
    };
}

/** OAuth calls made with no tenant token (the app's own access management). */
export interface SquareAppApi {
    oAuth: {
        obtainToken(
            request: Square.ObtainTokenRequest,
        ): Promise<Square.ObtainTokenResponse>;
        revokeToken(
            request: Square.RevokeTokenRequest,
            requestOptions?: OAuthRequestOptions,
        ): Promise<Square.RevokeTokenResponse>;
    };
}
