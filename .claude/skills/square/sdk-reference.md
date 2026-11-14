# Square SDK reference (square@46.0.0, API version 2026-09-16)

Copied from the package's `.d.ts` files on 2026-10-21. If `package.json` pins a different major version, re-check against `node_modules/square/api/resources/**/client/Client.d.ts` before relying on this.

## Client

```ts
import { Square, SquareClient, SquareEnvironment, SquareError, SquareTimeoutError, WebhooksHelper } from 'square';

const client = new SquareClient({
    token,                                   // string | Supplier<string>
    environment: SquareEnvironment.Sandbox,  // .Production = https://connect.squareup.com
    version: '2026-09-16',
    timeoutInSeconds: 30,                    // optional
    maxRetries: 2,                           // optional
});
```

Methods return `HttpResponsePromise<T>`. `await` it to get `T`. Each per-call `requestOptions` also accepts `timeoutInSeconds`, `maxRetries` and `version`.

## Orders — `client.orders`

| Method | Request | Notes |
|---|---|---|
| `get(req)` | `{ orderId: string }` | → `{ order?: Square.Order }` |
| `batchGet(req)` | `{ locationId?: string; orderIds: string[] }` | |
| `search(req)` | `{ locationIds?; cursor?; query?: { filter?, sort? }; limit?; returnEntries? }` | manual cursor paging via `response.cursor` |
| `create`, `update`, `calculate`, `clone`, `pay` | — | **forbidden**: the sync is one-way |

`SearchOrdersFilter`: `stateFilter`, `dateTimeFilter: { createdAt?, updatedAt?, closedAt?: TimeRange }`, `fulfillmentFilter`, `sourceFilter`, `customerFilter`. Square only allows sorting by the same timestamp field you filter on.

### `Square.Order` (fields we use)
`id`, `locationId`, `referenceId`, `state: 'OPEN'|'COMPLETED'|'CANCELED'|'DRAFT'`, `version: number`, `lineItems?: OrderLineItem[]`, `fulfillments?: Fulfillment[]`, `createdAt`/`updatedAt`/`closedAt` (RFC 3339 strings), `totalMoney`, `metadata?: Record<string, string|null>`, `ticketName`.

### `Square.OrderLineItem`
`uid`, `name`, `quantity: string`, `catalogObjectId` (ITEM_VARIATION id), `catalogVersion: bigint`, `variationName`, `note`, `modifiers`, `basePriceMoney`, `totalMoney`.

### `Square.Fulfillment`
`type: 'PICKUP'|'SHIPMENT'|'DELIVERY'|'IN_STORE'`, `state`, `pickupDetails?: { recipient?, pickupAt?, note?, ... }`, `deliveryDetails?: { recipient?, deliverAt?, note?, dropoffNotes?, ... }`.
`FulfillmentRecipient`: `customerId`, `displayName`, `emailAddress`, `phoneNumber`, `address?: Square.Address`.

## Catalog — `client.catalog` / `client.catalog.object`

| Method | Request | Notes |
|---|---|---|
| `catalog.list(req?)` | `{ cursor?; types?: string; catalogVersion?: bigint }` | returns `Page<CatalogObject>`. Use `for await (const obj of page)` |
| `catalog.search(req?)` | `{ cursor?; objectTypes?; includeDeletedObjects?; includeRelatedObjects?; beginTime?; query?; limit? }` | → `{ objects?, relatedObjects?, cursor?, latestTime? }` |
| `catalog.searchItems(req?)` | item-specific filters | |
| `catalog.batchGet(req)` | `{ objectIds; includeRelatedObjects? }` | |
| `catalog.object.get(req)` | `{ objectId; includeRelatedObjects?; catalogVersion? }` | |
| `batchUpsert`, `batchDelete`, `object.upsert`, `object.delete`, `updateItem*` | — | **forbidden**: the sync is one-way |

`types` on `list` is a comma-separated string (`'ITEM,ITEM_VARIATION'`). `objectTypes` on `search` is an array.

### `Square.CatalogObject` (discriminated union on `type`)
Common: `id`, `version?: bigint`, `updatedAt`, `isDeleted`, `presentAtAllLocations`, `presentAtLocationIds`, `absentAtLocationIds`.
- `type: 'ITEM'` → `itemData?: { name, description, categoryId, categories, variations?: CatalogObject[], isArchived, ... }`
- `type: 'ITEM_VARIATION'` → `itemVariationData?: { itemId, name, sku, ordinal, pricingType, priceMoney, sellable, ... }`
- `type: 'CATEGORY'` → `categoryData?: { name, ... }`

## Locations — `client.locations`
| Method | Request | Notes |
|---|---|---|
| `list()` | none (no paging) | → `{ locations?: Square.Location[] }` |
| `get(req)` | `{ locationId: string }` | |
| `create`, `update` | — | **forbidden** |

`Square.Location` fields we use: `id`, `name`, `status` (`ACTIVE`/`INACTIVE`), `timezone` (IANA, e.g. `America/New_York`), `address`, `merchantId`.

## Merchants — `client.merchants`
`get({ merchantId: 'me' })` → `{ merchant?: { id, businessName, ... } }`. Called after the OAuth callback to get `businessName` for the connection screen. `merchantId` itself comes from `obtainToken`.

## OAuth — `client.oAuth`
| Method | Request | Notes |
|---|---|---|
| `obtainToken(req)` | `{ clientId; clientSecret?; code?; redirectUri?; grantType: 'authorization_code' \| 'refresh_token'; refreshToken? }` | → `{ accessToken?, expiresAt?, refreshToken?, refreshTokenExpiresAt?, merchantId?, tokenType? }` |
| `revokeToken(req)` | `{ clientId?; accessToken?; merchantId?; revokeOnlyAccessToken? }` | requires `Authorization: Client <application secret>`; set it through request options |
| `retrieveTokenStatus()` | none (uses the client's bearer token) | → scopes, expiry, merchant id |

The authorize step is a browser redirect, not an SDK call: `<base>/oauth2/authorize?client_id=…&scope=A+B+C&state=…[&session=false]`. Base: `https://connect.squareup.com` (production) or `https://connect.squareupsandbox.com` (Sandbox, where `session=false` isn't supported). Access tokens last 30 days. Code-flow refresh tokens don't expire until revoked.

## Money
`Square.Money = { amount?: bigint | null; currency?: Square.Currency }`. The amount is in the smallest unit (cents).

## Errors
```ts
try { ... } catch (err) {
    if (err instanceof SquareError) {
        err.statusCode;   // number | undefined
        err.errors;       // { category, code, detail?, field? }[]  e.g. code 'VERSION_MISMATCH', 'NOT_FOUND', 'UNAUTHORIZED'
    } else if (err instanceof SquareTimeoutError) { ... }
    throw err;
}
```

## Webhooks
```ts
const ok: boolean = await WebhooksHelper.verifySignature({
    requestBody: req.rawBody.toString('utf8'),
    signatureHeader: req.header('x-square-hmacsha256-signature') ?? '',
    signatureKey,       // from Developer Console webhook subscription
    notificationUrl,    // exact registered URL
});
```
Event envelope (wire format is snake_case): `{ merchant_id, type, event_id, created_at, data: { type, id, object } }`.

| Event | `data.object` | Contains |
|---|---|---|
| `order.created` | `{ order_created: { order_id, version, location_id, state, created_at, updated_at } }` | ids only, so fetch the order |
| `order.updated` | `{ order_updated: { ... same ... } }` | ids only |
| `order.fulfillment.updated` | `{ order_fulfillment_updated: { order_id, version, location_id, state, fulfillment_update: [...] } }` | |
| `catalog.version.updated` | `{ catalog_version: { updated_at } }` | timestamp only, so `catalog.search({ beginTime })` |
| `oauth.authorization.revoked` | `{ revocation: { revoked_at, revoker_type } }` | the seller is the envelope's top-level `merchant_id`. Mark that connection `disconnected` |

The SDK's camelCase types (`Square.OrderCreatedEvent`, etc.) describe the *deserialized* shape. A raw `JSON.parse(rawBody)` gives snake_case keys. Either validate and map the snake_case payload yourself, or run it through the SDK's `serialization` module. Don't cast the raw parse to the camelCase type.
