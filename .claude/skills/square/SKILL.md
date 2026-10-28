---
name: square
description: Conventions for the one-way Square → Petsi integration (square npm SDK v46+), covering Orders/Catalog/Locations ingest, per-tenant OAuth connections (connect/callback/refresh/revoke), the tenant-managed enablement and mapping link tables (locations, categories, item hints, size aliases, variations, modifiers), container/modifier mapping, unresolved lines and order issues, webhooks, money/BigInt handling and testing. Use whenever writing, reviewing or debugging code that imports from 'square', handles Square webhooks, or maps Square orders/catalog objects to Order / MenuItem / MenuItemSize.
---

# Square integration (Orders + Catalog)

Read this before touching any Square code. Exact SDK signatures (checked against `square@46.0.0`'s type definitions) are in `sdk-reference.md` next to this file. Read it before calling an SDK method you haven't used in this session, and don't trust Square's README or older blog posts over it. Both show APIs from older SDKs that changed in v40+.

## Scope

**Data flows one way: Square → Petsi.** We never write to Square. Only these read methods are allowed:

- **Orders API** — `orders.get`, `orders.batchGet`, `orders.search`. Square orders become Petsi `Order`s, stamped with the connection's default category (see "Order category").
- **Catalog API** — `catalog.list`, `catalog.search`, `catalog.batchGet`, `catalog.object.get`. Square `ITEM_VARIATION` objects map to a `MenuItem` + `MenuItemSize` pair; `MODIFIER` objects map to a `MenuItem` + `MenuItemSize` or are ignored.
- **Locations API** — `locations.list`, `locations.get`. Feeds the location mapping.
- **Merchants API** — `merchants.get({ merchantId: 'me' })`. Gets the business name to show on the connection screen.
- **OAuth API** — `oAuth.obtainToken`, `oAuth.revokeToken`, `oAuth.retrieveTokenStatus`. These manage our own access, so they're the one exception to the read-only rule.

Never call `create` / `update` / `upsert` / `delete` / `pay` / `clone` on any Square resource. If a task seems to need a write, or another API (Payments, Customers, Inventory…), stop and ask.

## Decisions

All settled (the grilling session of 2026-10-24 settled 5–17). Don't re-open them without asking.

1. **One-way sync, Square → Petsi.**
2. **Credentials: OAuth only, one connection per tenant.** Petsi is a single Square application, and each tenant authorizes it through Square's OAuth code flow. Personal access tokens are not supported, not even for the developer's own store: it connects through the same flow. Don't add a "paste your token" path. Details in "OAuth connection" below.
3. **Mapping: separate link tables, not columns on domain entities.** See "Enablement / mapping layer" below for why.
4. **Locations are mapped per tenant, many-to-one.** Each Square location link points to at most one Petsi location; several Square locations may point to the same one.
5. **Only pickup/delivery orders are imported.** An order needs a `PICKUP` or `DELIVERY` fulfillment. Counter sales (no fulfillment, `IN_STORE`) and `SHIPMENT` are skipped and leave no order link.
6. **Initial import = enabling a location; future-due orders only.** No history backfill, no polling job. A manual "Re-sync location" re-runs the same import.
7. **Modifiers are mapped through a modifier link table**, with a `modifierMode` on the variation link. Mapping one modifier propagates to same-named siblings **within the same Square item only**.
8. **Item/size mapping is derived** from a tenant-wide size alias table plus per-item hints; the variation link stays the source of truth and manual overrides stick.
9. **Fixed containers (including chef's-choice boxes) are expanded from the Petsi menu item's container definition.** Only variable containers (Box of 6 Cookies / Muffins) take contents from modifiers.
10. **New catalog links default to enabled**, unless their Square category link is disabled. New links are flagged "needs review".
11. **Lines that can't be placed become `SquareUnresolvedLine`s; orders Petsi rejects become `SquareOrderIssue`s.** Never invent data (no placeholder addresses), never fail the webhook.
12. **Square owns imported orders' Square-derived fields; Petsi edits to them are blocked. "Detach" hands the order to Petsi.**
13. **Cancellation is automatic; refunds are flagged, never auto-applied.**
14. **One default order category per connection.** Never auto-created.
15. **Access:** tenant admins own the connection and location links; admins/managers edit the catalog mapping; managers at the order's location resolve lines/issues. Everything is behind the `SQUARE_INTEGRATION` feature flag.
16. **Resolving a mapping converts pending lines on active, non-frozen, non-detached orders**, in one transaction per order.
17. **We expect Square to provide recipient, phone, address and due date.** No special-case handling for missing fields beyond the generic order-issue catch-all.

## OAuth connection

**App-level config** (one Square application, read through `ConfigService`): `SQUARE_APPLICATION_ID`, `SQUARE_APPLICATION_SECRET`, `SQUARE_OAUTH_REDIRECT_URL`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_WEBHOOK_NOTIFICATION_URL`, and a key for encrypting tokens at rest. Sandbox and production are separate Square applications with separate ids, secrets and keys. Which pair is in use follows `NODE_ENV`, like the DB config. The application secret and the encryption key are the most sensitive values in the system. Never log them, return them or commit them.

**`SquareConnection` entity** (`TenantScopedServiceBase`): `tenantId` (unique), `merchantId` (unique: one Square seller can't be connected to two tenants, or webhook routing becomes ambiguous), `businessName`, encrypted `accessToken`, `accessTokenExpiresAt`, encrypted `refreshToken`, `scopes`, a `status` of `connected | needs_reauth | disconnected`, `catalogSyncedAt` (the `catalog.search` `latestTime` cursor), and `defaultOrderCategoryId` (nullable FK to `OrderCategory`, `onDelete: 'SET NULL'`). Tokens never appear in any API response, DTO, log or revision-history snapshot.

**Flow:**
1. **Start (authenticated, tenant admins only; see `src/modules/roles/CLAUDE.md`).** The frontend uses Bearer auth, so this endpoint *returns* the authorize URL for the frontend to navigate to rather than issuing a 302. The URL is `<base>/oauth2/authorize?client_id=…&scope=ORDERS_READ+ITEMS_READ+MERCHANT_PROFILE_READ&state=…`. `<base>` is `https://connect.squareup.com` or `https://connect.squareupsandbox.com`. Add `session=false` in production only; Sandbox doesn't support it. Request only these read scopes.
2. **`state` carries the tenant.** The callback is a browser redirect from Square with no Bearer token, so it must be `@Public()`, and `state` is the only thing tying it to a tenant. Make `state` a short-lived (≈10 min) signed token (`@nestjs/jwt` is already a dependency) holding `tenantId`, `userId` and a nonce. Make it single-use: record the nonce and reject a replay. Never trust a tenant id from the query string.
3. **Callback.** If Square returns `error` (e.g. the seller clicked Deny), redirect to the frontend settings page with an error flag. Otherwise verify `state` and call `oAuth.obtainToken({ clientId, clientSecret, code, redirectUri, grantType: 'authorization_code' })`. The response holds `accessToken`, `expiresAt` (30 days), `refreshToken` and `merchantId`. Reject the connection if `merchantId` already belongs to another tenant. Upsert the tenant's `SquareConnection`, fetch `businessName`, pre-select `defaultOrderCategoryId` (see "Order category"), run the first **location sync and full catalog sync**, then redirect the browser to the frontend settings page. **No orders are imported here**: every location link starts disabled (see "Initial import and re-sync").
4. **Refresh.** A daily `@Cron` (`@nestjs/schedule` is already used) refreshes every `connected` connection whose access token expires within 7 days: `obtainToken({ clientId, clientSecret, refreshToken, grantType: 'refresh_token' })`. Store the new access token and expiry, and the refresh token too if one comes back. Code-flow refresh tokens don't expire until access is revoked. If the refresh fails with 401 or 400 `invalid_grant`, set `needs_reauth`. Don't retry in a loop.
5. **Disconnect (tenant action).** Call `oAuth.revokeToken({ clientId, merchantId })` with the header `Authorization: Client <application secret>`. Check the SDK's request options for how to pass it. Then set `disconnected`, wipe the stored tokens, and keep the link tables so mappings survive a reconnect.
6. **Revoked from Square's side.** Handle the `oauth.authorization.revoked` webhook the same way as Disconnect, minus the API call.

Every Square call for a tenant first loads its `SquareConnection` and refuses to proceed unless `status === 'connected'`.

## Enablement / mapping layer

Tenants control which Square data flows into Petsi. The link tables *are* that control layer. Every Square object we've seen gets a row, whether it's mapped, unmapped or disabled, because the UI needs to list things that have no Petsi entity yet. Columns on `Location`/`MenuItem` can't represent "seen in Square, not mapped, disabled". A link table also keeps Square ids out of `Order`'s revision-history snapshot (`OrderSnapshotV1`), which a new column on `Order` would force into the snapshot.

All link tables are tenant-scoped (a `tenantId` column) with `@Unique(['tenantId', '<squareId column>'])`. **Syncs refresh Square-side fields only; they never overwrite a tenant's choices** (`enabled`, mappings, modes). Auto-match is exact (trim + lowercase + collapse whitespace), only on new unmapped rows, only when there's exactly one candidate. No fuzzy matching. Catalog mapping is **tenant-wide**: ignore `present_at_location_ids`.

FKs from link tables to Petsi entities (`locationId`, `menuItemId`, `menuItemSizeId`, `defaultOrderCategoryId`) are nullable with `onDelete: 'SET NULL'`: deleting a Petsi entity unmaps the link, and future lines for it become unresolved.

### Location link

`squareLocationId`, `squareName`, `squareStatus`, `timezone`, `enabled` (**default `false`**), `locationId` (nullable FK to Petsi `Location`, **not unique**: many-to-one).

- A sync calls `locations.list()` and upserts by `squareLocationId`.
- Auto-match `locationId` by exact name as above.
- "Create a new Petsi location from this Square location" is an explicit tenant action in the UI. It must go through `LocationService` and its validator, never the sync. Locations carry user assignments and permissions.
- Keep `timezone`. Square timestamps are UTC, and the location's timezone decides the local fulfillment day.
- Enabling a location runs the initial import for it (see below). Enabling requires `locationId` to be set.

### Catalog: category link

One row per Square `CATEGORY` (from items' `reporting_category`): `squareCategoryId`, `squareName`, `enabled` (default `true`).
- Bulk enable/disable: toggling a category toggles `enabled` on all its variation and modifier links that aren't `manual`.
- It's also the default for **new** links: a new variation or modifier link starts with `enabled = categoryLink.enabled` (`true` if the item has no category).

### Catalog: item hint and size alias

These pre-fill variation links. Neither is read by ingest directly.
- **Item hint**, one row per Square `ITEM`: `squareItemId`, `squareItemName`, `squareCategoryId`, `isArchived`, `isDeleted`, `menuItemId` (nullable).
- **Size alias**, tenant-wide: `squareVariationName` (stored normalized: trim, lowercase, collapse whitespace; unique per tenant), `menuItemSizeId` (nullable). The UI may *suggest* matches that ignore the `serves N-M` suffix, but never applies them automatically.

### Catalog: variation link (source of truth for ingest)

One row per `ITEM_VARIATION`, because order line items reference variations: `squareVariationId`, `squareItemId`, `squareItemName`, `squareVariationName`, `squareVersion` (bigint), `isDeleted`, `isArchived`, `enabled`, `menuItemId` and `menuItemSizeId` (both nullable), `modifierMode` (`none | modifier_is_item | container_contents`, default `none`), `mappingSource` (`derived | manual`), `reviewedAt` (nullable).

- **Derivation.** For `derived` links, `menuItemId` comes from the item hint and `menuItemSizeId` from the size alias of the normalized variation name. It's applied only when the size is in that menu item's `sizes`; otherwise the link is left unmapped. When the mapped item is a `CONTAINER` with non-null `variableMaxAmount`, `modifierMode` defaults to `container_contents`.
- **Manual override.** A tenant edit sets `mappingSource = manual`. Item-hint or alias changes never overwrite manual links. This is what handles items whose variations are different products ("Baked Item / Whoopie Pie", "Cookie / Linzer Cookie").
- **Re-derive.** Changing an item hint or a size alias re-derives every `derived` link it affects, then runs pending-line conversion (see "Resolution") for links that became mapped.
- **Mapping validation at save time:** `modifierMode = container_contents` requires a variable container; `modifier_is_item` requires the variation to have attached modifier lists.

### Catalog: modifier link

One row per Square `MODIFIER`: `squareModifierId`, `squareModifierListId`, `squareModifierListName`, `squareModifierName`, `squareItemIds` (the items the list is attached to), `isDeleted`, `enabled`, `kind` (`item | ignore`), `menuItemId` and `menuItemSizeId` (nullable, a `SINGLE` item), `mappingSource`, `reviewedAt`.

- Square models a "choose 6 cookies" box as **several single-select modifier lists, each with its own copy of every flavor** (two "Chocolate Chip" modifiers with different ids appear on one line). So one flavor is several modifier objects.
- **Sibling propagation.** Mapping a modifier (or setting `ignore`) applies the same mapping to every modifier with the same normalized name in other modifier lists attached to **the same Square item**, unless that sibling is `manual`. Catalog syncs do the same for new or unmapped modifiers whose mapped sibling exists. Never propagate across Square items.
- Add-ons such as "Flavor Shot" are `ignore`.

### Order link

`squareOrderId` (unique per tenant), `squareVersion`, `orderId`, `squareLocationId`, `status` (`linked | detached`), and `lineMap` (JSONB: `squareLineUid → orderMenuItemId[]`). This is the dedupe key, the stale-version check, and how updates know which Petsi lines are Square-derived. One Square line can produce several Petsi lines.

### Needs review

Links created by a sync have `reviewedAt = null`. A tenant viewing or saving one sets it. Archived and deleted items keep their links (old orders reference them) but are hidden from the default mapping view; they're never auto-disabled.

## Order ingest

One ingest path, fed by webhooks, the initial import and "Re-sync location". Given a full Square order:

1. **Location.** Skip (2xx, no link) unless the location link is `enabled` and has `locationId`.
2. **Scope.** Skip (no link) unless some fulfillment is `PICKUP` or `DELIVERY`. Skip `DRAFT` (no link, no stored version).
3. **Dedupe/version.** Ignore if the order link's `squareVersion` ≥ this version. If the link is `detached`, apply only the cancellation check (see "Cancellation and refunds").
4. **Order fields.** `fulfillmentType` = lowercase type. Due date = `pickupDetails.pickupAt` / `deliveryDetails.deliverAt`. Recipient/phone/email from `recipient.displayName` / `phoneNumber` / `emailAddress`. `deliveryAddress` = `recipient.address` `addressLine1`, `addressLine2`, `locality`, `postalCode` joined with `, `. Category = the connection's `defaultOrderCategoryId` on create only. `locationId` = the location link's Petsi location.
5. **Lines**, per Square line item:
   - No `catalogObjectId` → unresolved (ad-hoc).
   - Variation link missing or unmapped → unresolved. Link `disabled` → skipped silently.
   - `modifierMode = none` → one `OrderMenuItem` (quantity = line quantity). If the menu item is a **fixed** container (`variableMaxAmount` null), copy that size's `MenuItemContainerItem` rows into `containerOrderMenuItems`. Neither the order composers nor the validator do this, and an empty fixed container passes validation, so ingest must.
   - `modifierMode = modifier_is_item` (Scone + flavor modifier) → one `OrderMenuItem` per `item` modifier with that modifier link's item and size, quantity = line quantity × modifier quantity. `ignore` modifiers are skipped. If any non-ignored modifier is unmapped, the whole line is unresolved.
   - `modifierMode = container_contents` (Box of 6 Cookies / Muffins) → one container `OrderMenuItem` (quantity = line quantity). Its contents come from the `item` modifiers, **merged by `menuItemId:menuItemSizeId`** with quantities summed (modifier quantity is per unit of the line). The order validator rejects duplicate contained items (`DUPLICATE_ITEMS`), requires the sum to equal `variableMaxAmount` (`OUT_OF_RANGE`), and requires each contained item in the box's allowed `MenuItemContainerItem` list (`INVALID_REFERENCE`). An unmapped modifier, or any of those failures, makes the **line** unresolved.
6. **Write** through `OrderService` with the `square_webhook` actor (or the triggering user for import/re-sync/resolution). On update, diff Square lines against `lineMap`: add, update or remove only Square-derived `OrderMenuItem`s, never staff-added ones. Recompute pending unresolved lines for that order without duplicating them, and leave `resolved`/`dismissed` rows whose `squareLineUid` still exists.
7. **Whole-order rejection.** If `OrderService` rejects the order with a `VALIDATION_ERROR`, record a `SquareOrderIssue` (below) and still return 2xx.

## Initial import and re-sync

- **Trigger:** enabling a location link (tenant admin), and the manual, rate-limited, admin-only "Re-sync location" action. Not the OAuth callback, and never a cron.
- **Query:** `orders.search` for that Square location: `state` in `OPEN, COMPLETED`; fulfillment type `PICKUP`/`DELIVERY`; then keep only orders whose due date is **today or later in the location link's `timezone`**. No historical orders.
- Every result goes through "Order ingest". Dedupe and version checks make re-sync idempotent.
- This is how webhook gaps (outage, a period with the flag off) are recovered. It isn't polling and must not become a scheduled job.

## Ownership of imported orders

- **Square-owned (read-only in Petsi while `linked`):** recipient, phone, email, delivery address, fulfillment date and type, notes that came from Square, and every Square-derived `OrderMenuItem` (and its container contents). `OrderService.update` on a linked order returns a validation error for these fields. `OrderResponseDto` exposes `squareLinked` so the UI can lock them.
- **Petsi-owned (editable):** category, `isFrozen`, internal notes, and lines staff add. Ingest never touches lines missing from `lineMap`.
- **Detach** (manager at the order's location): sets the order link to `detached`, clears `lineMap`, and dismisses the order's pending unresolved lines. Later Square events are ignored except a cancellation, which records a `SquareOrderIssue` instead of cancelling.

## Unresolved lines (placeholders, alert, resolution)

A line the system can't place needs a person to step in. That covers an unmapped variation link, a variation not yet seen by a catalog sync, an ad-hoc line with no `catalogObjectId`, an unmapped non-ignored modifier, and a container line that fails container rules. It's never dropped, and it's never forced into an `OrderMenuItem`.

- **Storage: a separate `SquareUnresolvedLine` table**, not a nullable `OrderMenuItem.menuItem`. `OrderMenuItem.menuItem` stays required, so reports, validators and `OrderSnapshotV1` are unaffected. Columns: `tenantId`, `locationId`, `orderId`, `squareOrderId`, `squareLineUid`, `squareVariationId` (null for ad-hoc lines), `squareItemName`, `squareVariationName`, `squareModifiers` (JSONB snapshot of the line's modifier ids, names and quantities), `reason` (`unmapped_variation | unmapped_modifier | ad_hoc | container_invalid`), `quantity`, `note`, and `status` (`pending | resolved | dismissed`). Put `@Unique` on `['tenantId', 'squareOrderId', 'squareLineUid']`.
- **Placeholders.** `OrderResponseDto` includes the order's pending unresolved lines plus a `hasUnresolvedSquareLines` flag, so the order UI can show placeholder rows next to the real items.
- **Alert.** No notification system exists. The "alert" is data: an attention endpoint returning, per location, pending unresolved lines and open order issues, plus tenant-wide counts of enabled-but-unmapped links and links awaiting review. Don't build push or email notifications unless asked.
- **Resolution screen.** Pending lines grouped by `squareVariationId` (and by modifier for `unmapped_modifier`), with ad-hoc lines listed one by one.
  - **Map a variation/modifier** (or fix an item hint / size alias): update the link(s), then convert pending lines that now resolve.
  - **Map an ad-hoc line:** the tenant picks a menu item and size for that one line, and it's converted the same way.
  - **Disable a variation:** its pending lines become `dismissed`, and future lines for it are skipped.
  - **Fix a container problem** (e.g. add a flavor to the box's allowed list in Petsi): "Retry" re-runs that line.
- **Conversion rules.** Convert pending lines on orders that are `ACTIVE`, not `detached` and **not frozen**, regardless of due date. Lines on frozen orders stay `pending` until the order is unfrozen. Run one transaction per order through `OrderService`, with the resolving user as revision actor, marking lines `resolved` in the same transaction. If one order fails validation, only its lines stay pending and a `SquareOrderIssue` is recorded; other orders still convert.

## Order issues

`SquareOrderIssue`: one row per Square order that needs a person at the order level. Columns: `tenantId`, `squareLocationId`, `squareOrderId` (unique per tenant), `orderId` (nullable), `squareVersion`, `reason` (`validation_failed | location_unmapped | refund_received | cancelled_while_detached`), `detail` (the validation error tree or a short refund summary; **never** a raw Square body), `status` (`open | resolved | dismissed`), `lastAttemptAt`.

- `validation_failed` / `location_unmapped`: no order is created and nothing is invented. Retry on the next Square update, a manual "Retry", or "Re-sync location". Success sets `resolved`.
- Issues count toward the attention endpoint.

## Cancellation and refunds

- **Auto-cancel** the Petsi order when Square `state === CANCELED`, **or** when every `PICKUP`/`DELIVERY` fulfillment is `CANCELED` or `FAILED`. This needs a new general order status on `Order` (`status: ACTIVE | CANCELLED`), separate from the recurrence-only `occurrenceState`. A cancelled order is excluded from reports and the default lists, the same way `isFrozen` excludes orders. The status must be added to `OrderSnapshotV1`, `orderToSnapshotV1` and `applyOrderSnapshotV1` (see `src/modules/orders/CLAUDE.md`). Its pending unresolved lines become `dismissed`. Record the cancel with the `square_webhook` revision actor.
- **Refunds never change lines.** A paid Square order's `line_items` don't change on a refund. Refunds appear as `returns[]` / `return_amounts` and a separate return order. When an update brings new returns, record a `SquareOrderIssue` with `reason = refund_received` and a summary (line uids, quantities). Staff decide, via Detach and edit.
- **Fulfillment progress states** (`PROPOSED → RESERVED → PREPARED → COMPLETED`) are ignored. `order.fulfillment.updated` still re-fetches the order to apply due-date, contact and cancellation changes.

## Order category

`SquareConnection.defaultOrderCategoryId`. On connect, pre-select a tenant category named "Square" (case-insensitive) if one exists, otherwise leave it null. Never create a category from the integration; tenants create one through `OrderCategoryService` in settings. Ingest sets it on create only (category is Petsi-owned). Per-location overrides are deferred.

## Access and feature flag

| Action | Who |
|---|---|
| Connect, disconnect, default category | Tenant admin |
| Location links (map, enable, re-sync) | Tenant admin |
| Catalog mapping (category toggles, item hints, size aliases, variation/modifier links, review) | `admin` or `manager` at any location (tenant-wide check) |
| Resolve/dismiss unresolved lines, retry/dismiss issues, Detach | `manager`+ at the order's location (`@LocationScope`) |
| Attention counts, placeholders | Anyone who can read that location's orders |

Add `SQUARE_INTEGRATION` to `FEATURE_REGISTRY` (`src/modules/feature-flags/utils/feature.registry.ts`) and require it on every Square route except the webhook and OAuth callback. The webhook handler checks the tenant's flag after resolving the tenant from `merchant_id`; if it's off, acknowledge and drop the event. Turning the flag off doesn't revoke the token. Use "Re-sync location" after turning it back on.

## SDK usage rules

- **Package:** `square` (v46+). Import from `'square'`, never from `'square/legacy'` (the pre-v40 `Client` / `ordersApi.createOrder` style). Types are under the `Square` namespace: `import { Square, SquareClient, SquareError } from 'square'`.
- **Clients are per tenant, built by one injected factory.** A provider in `src/modules/square/` takes a tenant's `SquareConnection`, decrypts the access token and returns a `SquareClient`. Services get that factory through DI so tests can override it. Never call `new SquareClient` in a domain service, and never share one tenant client across tenants. The OAuth calls (`obtainToken`/`revokeToken`) use a client with no tenant token.
- **Environment comes from `NODE_ENV`, like the DB config.** Use `SquareEnvironment.Production` only when `NODE_ENV === 'production'`, and `SquareEnvironment.Sandbox` otherwise, so dev and test can never reach production data. A Sandbox token against the Production base URL (or the other way round) gives 401 `UNAUTHORIZED`. App-level config goes through `ConfigService`, never `process.env` in services.
- **Pin the API version.** Pass `version: '2026-09-16'` (the only value v46's types allow) so a dependency bump can't silently change response shapes.
- **Least privilege.** Request only `ORDERS_READ`, `ITEMS_READ` and `MERCHANT_PROFILE_READ`. Adding a scope later means every tenant has to re-authorize, so ask before adding one.

## Data-shape gotchas

- **Money is `bigint` in the smallest currency unit** (`{ amount: 1250n, currency: 'USD' }` = $12.50). `JSON.stringify` throws on `bigint`. That covers Nest responses, pino logs and revision-history JSONB snapshots, so convert at the boundary: use `big.js` (already a dependency) or `Number()` when the value fits in a safe integer. Never store a raw `Square.Money` on an entity or in a snapshot. Catalog `version` and `catalogVersion` are also `bigint`. Store them as `bigint` columns or strings, never as JS `number`.
- **Line-item and modifier `quantity` are decimal strings** (`"3"`), not numbers. Parse and validate them. `OrderMenuItem.quantity` is an integer. Modifier quantity is **per unit of the line** (line `"2"` + modifier `"1"` = 2 items).
- **Line items reference the *variation*, not the item.** `OrderLineItem.catalogObjectId` is an `ITEM_VARIATION` id; modifiers' `catalogObjectId` is a `MODIFIER` id with its own `catalogVersion`. Ad-hoc line items have no `catalogObjectId` at all.
- **Variations aren't always sizes.** Some items use variations as different products ("Baked Item" → "Bars", "ALL CAKE", "Whoopie Pie") and some have an empty variation name with the product chosen by modifier ("Scone" + "Lemon Glaze"). Size names are inconsistent (`Large 10" serves 8-10` vs `Large - 10" serves 8-10`), which is why size aliases exist.
- **Duplicate item names exist** (two "Apple Crumb Pie" ITEMs). Several links may point to one `MenuItem`.
- **`CatalogObject` is a discriminated union on `type`** (`'ITEM'`, `'ITEM_VARIATION'`, `'MODIFIER_LIST'`, `'MODIFIER'`, `'CATEGORY'`, …). Narrow on `obj.type` before reading `obj.itemData` / `obj.itemVariationData` / `obj.modifierListData`, and don't cast.
- **Deleted catalog objects come back with `isDeleted: true`** when you search with `includeDeletedObjects`. Keep their links (mark `isDeleted`) instead of upserting them as live; archived items (`isArchived`) likewise.
- **Fulfillment → Order fields.** See "Order ingest" step 4. Square Online pickup orders carry `pickup_at`, `schedule_type` (`SCHEDULED | ASAP`) and a full `recipient`; orders arrive as `state: OPEN` with fulfillment `PROPOSED`, and `source.name` is `"Square Online"` (counter sales are `"Point of Sale"` with `IN_STORE`).
- **Order state** is `OPEN | COMPLETED | CANCELED | DRAFT` (Square spells it with one L). `OPEN` and `COMPLETED` import the same way. `DRAFT` is never imported and must not create an order link (no row, no stored `squareVersion`), or the stale-version check would block the import when the draft later becomes `OPEN`.
- **Never store `tenders`.** Order responses include card `last_4`, `bin` and `fingerprint`. Strip `tenders` from any fixture before committing.
- **Square timestamps are RFC 3339 strings.** Convert with `new Date(...)` at the mapping boundary. Anything that depends on the local day (which day an order is due) uses the location link's `timezone`.

## Webhooks

- **One app-level subscription, one endpoint, one signature key.** The subscription in the Developer Console belongs to the Petsi application and delivers events for every seller that has authorized it. Use a single route, e.g. `POST /square/webhooks`, verified with `SQUARE_WEBHOOK_SIGNATURE_KEY` and `SQUARE_WEBHOOK_NOTIFICATION_URL`. *After* verifying, resolve the tenant from the event's `merchant_id` through `SquareConnection`. If there's no connection, it isn't `connected`, or the tenant lacks `SQUARE_INTEGRATION`, acknowledge with 2xx and drop the event, except `oauth.authorization.revoked`. Subscribe to `order.created`, `order.updated`, `order.fulfillment.updated`, `catalog.version.updated` and `oauth.authorization.revoked`.
- **Signature verification needs the raw body.** Create the app with `NestFactory.create(AppModule, { rawBody: true })` and read `req.rawBody`. Re-serializing the parsed JSON won't reproduce the bytes and verification fails.
- **`WebhooksHelper.verifySignature(...)` returns `Promise<boolean>`.** Await it. Square's README shows it without `await`, which is wrong for v40+, and an un-awaited Promise is always truthy. Header: `x-square-hmacsha256-signature`. `notificationUrl` must exactly match the URL registered in the Square Developer Console, including scheme and path. Behind a proxy, use the configured public URL, not one rebuilt from the request.
- On a bad signature, reject with 403 and don't process. The route is `@Public()` (from `src/common/decorators/PublicLogin`) because Square sends no JWT. The signature is the auth.
- **Payloads are thin.** `order.created` / `order.updated` / `order.fulfillment.updated` carry only `orderId`, `version`, `state` and `locationId` under `data.object.order_created|order_updated`. Always fetch the full order with `client.orders.get({ orderId })`. `catalog.version.updated` carries only a timestamp, so pull changes with `catalog.search({ beginTime: catalogSyncedAt, includeDeletedObjects: true })`, run sibling propagation and derivation on new or changed links, and store `latestTime` as the next cursor.
- **Webhooks are the live order path; there's no polling job.** The initial import and manual "Re-sync location" share the ingest path (see above). The old risk that POS sales don't fire `order.*` webhooks no longer matters, because counter sales aren't imported. An early task must still confirm that a **Square Online pickup order** in Sandbox fires `order.created`/`order.updated`. If it doesn't, stop and raise it with the user rather than quietly adding polling.
- **Events are at-least-once and can arrive out of order.** Dedupe on `event_id`, and ignore an order event whose `version` is ≤ the order link's `squareVersion`. Return 2xx quickly. Non-2xx and timeouts make Square retry. An event for a disabled or unmapped location, or an order Petsi rejects, still gets a 2xx.
- **No request context exists on the webhook path.** `TenantScopedServiceBase.getTenantId()` reads `tenantId` from `RequestContextService` and 404s without it, and `LocationScopedServiceBase` checks the caller's assigned locations. The tenant comes from the matched `SquareConnection`; resolve it before touching domain services. Read `location-scoped-service.base.ts` before routing writes through `OrderService`. A system writer may need to stamp `tenantId`/`locationId` explicitly, as `OrderRecurrenceService.cloneTemplateToOccurence` does (see `src/modules/orders/CLAUDE.md`).
- **Revision actor.** Changes made from a webhook should be recorded as `{ type: 'square_webhook' }`. `getRevisionActor` (`src/modules/revision-history/utils/revision-actor.util.ts`) only returns `user`/`system` today, so extend it rather than letting webhook writes show up as `system`.

## Errors and logging

- The SDK throws `SquareError` (`statusCode`, `errors[]` with `category`/`code`/`detail`, `body`) and `SquareTimeoutError`. Catch them at the Square-service boundary and rethrow as the app's typed exceptions from `src/common/exceptions/` (read its `CLAUDE.md`). Don't log there: `GlobalHttpExceptionFilter` is the only error logger. Never forward `err.body` to API clients. It can contain merchant data.
- Never log access tokens, webhook signature keys or full raw webhook bodies.
- A 401 from Square on a tenant's connection means the token was revoked or expired. Set the connection to `needs_reauth` so the UI can prompt the tenant to reconnect, instead of retrying forever.

## Testing

- **Unit/integration specs never call Square.** Override the injected client provider in the domain's `*-testing.module.ts` with a fake whose methods return typed `Square.*` fixtures. The DB conventions in the root `CLAUDE.md` still apply (unique `P` prefix, `DatabaseTestContext`, real Postgres).
- **Mapping functions (Square object → DTO) are pure.** Test them like change-detector specs: plain objects, no module bootstrap, no DB. Cover variation→item resolution, `bigint` money, string quantity, missing fulfillment, ad-hoc lines, `isDeleted`, each `modifierMode`, modifier quantity × line quantity, merging duplicate flavors, fixed-container expansion, and the delivery address join.
- **Scope:** an `IN_STORE`-only order → no link; a `PICKUP` order → imported; a `DRAFT` → nothing written, and the same order later as `OPEN` → imported; `COMPLETED` → imported like `OPEN`.
- **Derivation:** an item hint plus a size alias derives a link; an invalid size leaves it unmapped; a `manual` link survives an alias change; an alias change converts newly resolved pending lines.
- **Modifier propagation:** mapping one "Chocolate Chip" maps its siblings on the same item, not those on another item.
- **Unresolved lines:** an unmapped or ad-hoc line → a pending row, with no `OrderMenuItem` created; a disabled variation → no row; a box summing to 5 of 6, or with a flavor the box doesn't allow → the line is unresolved and the rest of the order imports; mapping converts pending lines on active orders but not frozen or detached ones; one failing order doesn't block others; a Square update doesn't duplicate pending rows.
- **Ownership:** editing a Square-owned field on a linked order → validation error; editing the category → allowed and kept across a Square update; a staff-added line survives a Square update; Detach → later updates ignored.
- **Cancellation and refunds:** `CANCELED` → Petsi order `CANCELLED` and pending lines `dismissed`; all fulfillments `CANCELED` → same; new `returns[]` → a `refund_received` issue with lines unchanged.
- **Order issues:** an order `OrderService` rejects → an issue, a 2xx, no order; the next update that fixes it → order created, issue `resolved`.
- **Initial import:** enabling a location imports future-due `OPEN` pickup orders and skips past-due ones (using the location timezone); a re-sync is idempotent.
- **Webhook tests:** build the app with `createHttpTestApp` (with `rawBody` enabled) and sign the request yourself. The signature is `base64(HMAC-SHA256(signatureKey, notificationUrl + rawBody))` with Node's `crypto`. Test: valid signature → processed; tampered body → 403; duplicate `event_id` → no second write; stale `version` → ignored; tenant without `SQUARE_INTEGRATION` → 2xx, nothing written.
- **OAuth tests:** callback with a valid `state` → connection stored, with tokens encrypted (assert the DB column ≠ plaintext), and location links created disabled; expired, tampered or replayed `state` → rejected; `error=access_denied` → no connection; a `merchantId` already owned by another tenant → rejected. Refresh cron: a token expiring soon is refreshed, and a failed refresh → `needs_reauth`. Fake the `oAuth` client and never hit Square.
- **Real Sandbox calls** belong only in an opt-in e2e spec that's skipped unless a `SQUARE_SANDBOX_ACCESS_TOKEN` env var is set (a token from a completed Sandbox OAuth flow). Never in the default `npm run test`. To run the full OAuth flow by hand in Sandbox, first open the test seller's Sandbox Dashboard from the Developer Console in another tab. You can't log in on the Sandbox authorize page directly. Sandbox allows an `http://localhost` redirect URL.

## Exploring the API while developing

Square's MCP server can inspect Sandbox data (catalog objects, orders) without writing code: `claude mcp add square -e ACCESS_TOKEN=<sandbox-token> -e SANDBOX=true -- npx square-mcp-server start`. Use it to grab realistic fixtures for specs. Strip personal data (recipients, `tenders`) before committing them.
