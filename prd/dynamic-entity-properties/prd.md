# Dynamic Entity Properties

## Problem Statement

The business needs to associate custom, admin-configured metadata with menu items for reporting and operational purposes. For example, linking a standard pie to its vegan counterpart requires a relationship that does not fit any existing field on MenuItem. There is no way today for an admin to define new properties on entities without a code change, and no way for the frontend to know how to render those properties without hardcoding.

## Solution

Introduce a two-part system: a `DynamicPropertyConfig` that lets managers define named properties (what entity type they apply to, what category they filter on, what type of value they hold), and a `MenuItemDynamicPropertyValue` join table that stores the actual values on MenuItems. Dynamic property values are returned inline on every MenuItem response so the frontend always has what it needs without extra requests. The config also communicates how each property should be rendered, derived automatically from the value type.

## User Stories

1. As a manager, I want to navigate to item settings and create a new dynamic property, so that I can extend menu items with custom metadata without a code deployment.
2. As a manager, I want to give a dynamic property a name, so that it is clearly labeled when displayed on a menu item.
3. As a manager, I want to specify which entity type a dynamic property applies to, so that the property only appears on relevant entities.
4. As a manager, I want to optionally restrict a dynamic property to a specific menu item category (e.g. "Pie"), so that it only appears on items in that category.
5. As a manager, I want to specify that a dynamic property holds a reference to another menu item, so that I can map relationships between items such as a pie and its vegan counterpart.
6. As a manager, I want to optionally restrict the selectable value entities to a specific menu item category, so that only relevant items appear in the dropdown.
7. As a manager, I want to specify that a dynamic property holds a file path, so that I can attach supplemental files or images to menu items.
8. As a manager, I want to delete a dynamic property configuration, so that I can remove properties that are no longer needed.
9. As a manager, I want to be prevented from deleting a property configuration that I did not intend to delete, understanding that deletion removes all saved values across all menu items.
10. As a manager, I want to rename a dynamic property after it has been created, so that I can correct naming mistakes without losing saved data.
11. As a manager, I want to be prevented from changing the structural fields of a property (entity type, category, value type) once items have values saved against it, so that existing data is not silently invalidated.
12. As a staff member, I want to see extra fields on a menu item detail view when that item belongs to a category with configured dynamic properties, so that I can view and manage all relevant information in one place.
13. As a staff member, I want a dropdown of valid menu items when editing an entity-reference dynamic property, so that I can select the correct related item without free-typing an ID.
14. As a staff member, I want to be prevented from selecting the menu item I am currently editing as the value of one of its own dynamic properties, so that I cannot create a self-referencing relationship.
15. As a staff member, I want to set or update a dynamic property value when creating or editing a menu item, so that I do not need to perform a separate save step.
16. As a staff member, I want to clear a dynamic property value by explicitly setting it to null, so that I can remove a previously set value.
17. As a staff member, I want omitting a dynamic property from an update payload to leave its existing value untouched, so that partial updates do not accidentally clear data.
18. As a staff member, I want to be prevented from assigning a value that does not match the config's required entity type and category, so that invalid relationships cannot be saved.
19. As a staff member, I want to be prevented from changing a menu item's category when it has saved dynamic property values that would become invalid, so that data is not silently orphaned.
20. As a staff member, I want dynamic property values to be included in the menu item's change history, so that I can audit when a vegan counterpart or other property was set or changed.

## Implementation Decisions

### New module: `dynamic-properties`

A new NestJS module owns the `DynamicPropertyConfig` entity and its full CRUD. This module exports its service so the `menu-items` module can import it for validation and response assembly. Config endpoints require `ROLE_MANAGER` or `ROLE_ADMIN`.

### New entity: `DynamicPropertyConfig`

Fields:
- `holderEntityType` — string enum, currently only `menuItem`; required
- `holderCategoryId` — nullable FK to `menu_item_categories`; null means the property applies to all menu items of the given entity type regardless of category
- `propertyName` — string; unique per `(holderEntityType, propertyName)`
- `valueType` — string enum: `entityReference` | `filepath`
- `valueEntityType` — nullable string; currently only `menuItem`; required when `valueType = entityReference`
- `valueEntityCategoryId` — nullable FK to `menu_item_categories`; null means any entity of the given type is a valid value

`fieldRenderType` is **not stored**. It is computed from `valueType` in application code (`entityReference` → `entity-select`, `filepath` → `file-upload`) and always included in response DTOs.

### Mutability rules on `DynamicPropertyConfig`

Once any `MenuItemDynamicPropertyValue` row exists for a given config:
- `holderEntityType`, `holderCategoryId`, `valueType`, `valueEntityType`, `valueEntityCategoryId` are locked; attempts to change them return 409.
- `propertyName` remains freely editable at all times.

### New entity: `MenuItemDynamicPropertyValue`

Lives in the `menu-items` module. Fields:
- `menuItem` — ManyToOne to `MenuItem`, cascade delete
- `config` — ManyToOne to `DynamicPropertyConfig`, cascade delete
- `valueText` — nullable varchar; populated when `config.valueType = filepath`
- `valueEntityId` — nullable integer FK to `menu_items`, SET NULL on referenced item delete; populated when `config.valueType = entityReference`
- Unique constraint on `(menuItemId, configId)` — one value per config per menu item

### Write path: integrated into existing MenuItem create/update flow

`CreateMenuItemDto` and `UpdateMenuItemDto` gain an optional `dynamicProperties: { configId: number; value: string | null }[]` field. A single `value` string carries the payload; the backend routes it to `valueText` or `valueEntityId` based on the config's `valueType`.

Update semantics:
- Omitting a config from the array leaves its existing value row untouched.
- Passing `value: null` deletes the value row (clears the property).
- Passing a non-null value upserts the value row.

### Validation: centralized with reusable helpers

`MenuItemValidator` orchestrates dynamic property validation and delegates config-aware checks to reusable helper methods on `DynamicPropertyConfigService`. Checks performed:
- Each provided `configId` resolves to an existing config.
- The config's `holderEntityType` and `holderCategoryId` match the MenuItem being saved (considering the DTO's `categoryId` for category checks).
- When `valueType = entityReference`, the referenced entity exists, is of `valueEntityType`, and (if `valueEntityCategoryId` is set) belongs to the correct category.
- If the MenuItem's `categoryId` is changing and existing dynamic property value rows reference configs that no longer apply to the new category, a validation error is returned — values must be explicitly cleared before the category can be changed.

### Read path: inline on every MenuItem response

Every MenuItem response includes a `dynamicProperties` array. Each element embeds full config metadata alongside the value so the frontend needs no separate fetch:

```
{
  configId,
  propertyName,
  fieldRenderType,       // computed: "entity-select" | "file-upload"
  valueType,             // "entityReference" | "filepath"
  valueEntityType,       // e.g. "menuItem", or null
  valueEntityCategoryId, // nullable
  value                  // string | null (entity ID serialized as string, or filepath)
}
```

Items with no applicable configs return an empty array.

### Candidate value fetching (entity-select)

The frontend reuses the existing `GET /menu-items?categoryId=X` endpoint, using `valueEntityCategoryId` from the config as the filter. Self-exclusion (preventing a menu item from selecting itself as its own value) is enforced client-side by filtering out the current item's id from the dropdown.

### Revision history

Dynamic property changes are folded into the existing MenuItem revision history entry via the existing `afterCreateInTransaction` / `afterUpdateInTransaction` hooks. No separate revision tracking is added. The stored snapshot includes the full `dynamicProperties` array.

### Roles

| Operation | Required role |
|---|---|
| Config CRUD | `ROLE_MANAGER`, `ROLE_ADMIN` |
| MenuItem create/update (including dynamic property values) | `ROLE_STAFF`, `ROLE_MANAGER`, `ROLE_ADMIN` (inherited from existing MenuItem endpoint) |

## Testing Decisions

A good test for this feature verifies observable behavior at the service or controller boundary — what comes back from a query, what is persisted after a mutation, what error is returned when validation fails — not the internal wiring (which builder was called, which repo method was invoked).

### `dynamic-property-config.service.spec.ts` *(new seam)*

Prior art: `menu-item.service.spec.ts`

Tests:
- Creating a config with valid fields persists and returns the config.
- `propertyName` uniqueness per `holderEntityType` is enforced (duplicate name returns error).
- Renaming `propertyName` when values exist succeeds.
- Changing a structural field (`holderCategoryId`, `valueType`, etc.) when values exist returns 409.
- Changing a structural field when no values exist succeeds.
- Deleting a config cascades and removes all associated value rows.

### `menu-item.validator.spec.ts` *(extend existing)*

Prior art: existing validator spec for MenuItem.

Tests:
- A valid dynamic property entry (matching config, valid value entity) passes validation.
- An unknown `configId` fails validation.
- A config that does not apply to the MenuItem's category fails validation.
- A value entity that does not belong to the required `valueEntityCategoryId` fails validation.
- Changing `categoryId` when stale dynamic property values exist for the old category fails validation.

### `menu-item.service.spec.ts` *(extend existing)*

Prior art: existing service spec for MenuItem.

Tests:
- Creating a MenuItem with `dynamicProperties` persists value rows and returns them inline.
- Updating a MenuItem with a new value upserts the row.
- Updating with `value: null` deletes the row.
- Omitting a config from an update payload leaves the existing row unchanged.
- A value row's `valueEntityId` becomes null when the referenced MenuItem is deleted (SET NULL behavior).

### `menu-item.controller.spec.ts` *(extend existing)*

Prior art: existing controller spec for MenuItem.

Tests:
- `findOne` response includes `dynamicProperties` array with full embedded config metadata.
- `findAll` response includes `dynamicProperties` on each item.
- A MenuItem with no applicable configs returns an empty `dynamicProperties` array.

## Out of Scope

- Dynamic properties for entities other than `MenuItem` (e.g. Orders, Inventory Items).
- Value types beyond `entityReference` and `filepath` (e.g. plain `string`, `integer`, `boolean`).
- Server-side enforcement of the self-reference exclusion (a menu item selecting itself as a value); this is handled client-side.
- Bulk migration tooling for re-categorizing menu items that have dynamic property values.
- UI for the settings page and menu item detail view (frontend implementation).
- Shared external cache invalidation (existing in-memory cache on ControllerBase covers this via existing invalidation on MenuItem mutations).

## Further Notes

- `holderEntityType` is stored as a string enum column even though it currently only holds `menuItem`. This preserves the uniqueness constraint semantics and avoids a migration when additional entity types are added.
- `fieldRenderType` is intentionally excluded from the database schema. The mapping from `valueType` to render hint is a development-time concern; storing it would allow it to diverge from what the frontend actually supports.
- The `valueEntityCategoryId` filter on candidate values is advisory — the frontend uses it to populate the dropdown, but the backend validator enforces it on save, so a stale frontend cannot persist an out-of-category value.
