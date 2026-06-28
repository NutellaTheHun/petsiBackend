status: done
blocked-by: [04-menu-item-dynamic-property-read-path.md]

---

## Source

`prd/dynamic-entity-properties/prd.md`

## What to build

Bump the MenuItem revision history snapshot to v2 so dynamic property values are captured in every revision entry. The existing `isMenuItemSnapshotV1` / `menuItemToSnapshotV1` helpers must not be changed — introduce a parallel v2 alongside them so old stored snapshots remain decodable.

**New snapshot shape (v2):**

```typescript
interface MenuItemSnapshotV2 {
  payloadVersion: 2;
  name: string;
  type: string;
  categoryId: number | null;
  sizeIds: number[];
  variableMaxAmount: number | null;
  containerItems: MenuItemContainerLineSnapshotV1[];   // reuse existing line type
  dynamicProperties: {
    configId: number;
    valueText: string | null;
    valueEntityId: number | null;
  }[];
}
```

`MenuItemService` must switch to using `menuItemToSnapshotV2` for all new revision writes (`afterCreateInTransaction`, `afterUpdateInTransaction`, `revertToRevision`). The revert path must continue to handle v1 snapshots gracefully (existing `isMenuItemSnapshotV1` guard covers this — no change needed).

Update `getSnapshotRelations` / `getUpdateDiffRelations` to include `dynamicPropertyValues` and `dynamicPropertyValues.config` so the relation data is available when the snapshot is built.

## Acceptance criteria

- [x] Creating a MenuItem with `dynamicProperties` stores a v2 snapshot in the revision history table that includes the `dynamicProperties` array.
- [x] Updating a MenuItem's dynamic property value writes a new v2 revision entry with the updated array.
- [x] The stored snapshot's `payloadVersion` is `2`.
- [x] Old v1 revisions (payloadVersion 1) can still be read back; `revertToRevision` continues to handle them without error.
- [x] A MenuItem with no dynamic property values stores `dynamicProperties: []` in the snapshot (not absent).
- [x] Revision-history service spec test verifies the snapshot field is present and correctly populated after a create and after an update.
