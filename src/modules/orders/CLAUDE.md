---
module: src/modules/orders
last_reviewed: 2026-07-04
---

## Overview

This module owns `Order` and everything nested under it: `OrderCategory` (simple lookup, one-to-many with `Order`), `OrderMenuItem` (a line item — a `MenuItem` + `MenuItemSize` + quantity on an order), `OrderContainerItem` (when an ordered `MenuItem` is itself a container, e.g. "Box of 6 Scones," the contained items are expressed here, one level below `OrderMenuItem`), and `RecurringOrderSchedule` (a one-to-one companion holding the RRULE string for orders that repeat).

`Order` doubles as both a normal order and a recurrence *template*. Two fields distinguish the two: `occurrenceType` (`TEMPLATE` | `OCCURRENCE`) and `occurrenceState` (`GENERATED` | `MODIFIED` | `CANCELLED`, only meaningful on occurrences). A template holds a `recurrenceSchedule` (RRULE); `OrderRecurrenceService` reads that schedule and materializes concrete `OCCURRENCE` orders up to a rolling 45-day horizon (`RECURRENCE_HORIZON_DAYS` in `services/order-recurrence.service.ts`), stamping each occurrence with `templateOrderId` pointing back at the template and a `recurrenceDate` for idempotent regeneration. Regeneration runs hourly via `@Cron(CronExpression.EVERY_HOUR)` and also inline after template create/update (`materializeTemplateOnCreate`, `handleTemplateOrderUpdate`), so occurrences reflect template edits without waiting for the next cron tick.

`Order` also participates in `revision-history` (see `src/modules/revision-history/CLAUDE.md` once it exists): every create/update appends a versioned JSONB snapshot (`utils/snapshots/order-snapshot.v1.ts`) plus a change log, and `OrderService.revertToRevision` can restore a prior snapshot wholesale (replacing all ordered items and the recurrence schedule) before re-persisting.

Key relationships:
- `Order 1—* OrderMenuItem 1—* OrderContainerItem` (two levels of nested composition, both `cascade`d from their parent)
- `Order 1—1 RecurringOrderSchedule` (nullable, cascade)
- `Order *—1 OrderCategory` (nullable, `SET NULL` on delete)
- `OrderMenuItem`/`OrderContainerItem` both reference `MenuItem`/`MenuItemSize` from `src/modules/menu-items` (cross-module dependency — this module imports `MenuItemsModule`)

## Enforced Patterns

- **Template/occurrence invariants are enforced in `OrderValidator`, not just convention.** A DTO with `templateOrderId` set must have `occurrenceType: OCCURRENCE` and a non-empty `occurrenceState`; a DTO with `recurrenceSchedule` set must have `occurrenceType: TEMPLATE` and a null/undefined `occurrenceState`. Any code path that creates/updates an `Order` bypassing `OrderValidator` (e.g. `OrderRecurrenceService.cloneTemplateToOccurence`) must keep these invariants consistent by hand — it does not re-run validation.
- **`OrderService.updateEntity` silently promotes `GENERATED` occurrences to `MODIFIED`** (`promoteGeneratedOccurrenceToModifiedIfNeeded`) whenever an occurrence is edited directly, so the recurrence cron won't blow away a user's manual edit on the next regeneration pass (`removeFutureGeneratedOrders` only deletes occurrences still in state `GENERATED`).
- **Every `Order` mutation must go through `runAfterOrderPersist`** after `manager.save(entity)` in `updateEntity` — this is what triggers `OrderRecurrenceService.handleTemplateOrderUpdate` when the edited order is a template. Skipping it means template edits (dates, items) never propagate to already-generated occurrences.
- **Change detection on `Order` is nested three levels deep and returns whole-array replacement, not per-item patches.** `OrderChangeDetector.detectOrderedItems`/`detectRecurringSchedule` return `undefined` (no-op) only when every nested child is a no-op too; if anything changed, added, or removed, the *entire* incoming array/object is passed through as the patch. Nested composers (`OrderMenuItemComposer`, `OrderContainerItemComposer`, `RecurringOrderScheduleComposer`) therefore always receive full nested DTOs on a real change, never a sparse diff — do not assume `updateEntity` sees only the changed nested item.
- **Snapshot payloads (`OrderSnapshotV1`) are versioned and validated at read time** (`isOrderSnapshotV1`) before a revert is applied — `revertToRevision` throws `BadRequestException` rather than trusting old/foreign-shaped JSONB blindly. Adding a field to `Order` that should survive revert requires updating the snapshot shape, `orderToSnapshotV1`, and `applyOrderSnapshotV1` together, not just the entity.
- **`OrderController` overrides `create`/`update`/`findAll`/`findOne` to return `OrderResponseDto` instead of the raw entity** (`orderToResponseDto`), because `RecurringOrderSchedule` doesn't map directly to its DTO shape. The plain-entity versions of these methods are kept on the controller body only "for reference" and are dead code — don't wire routes to them.
- **`fulfillmentType: 'delivery'` requires `deliveryAddress` and `phoneNumber`** (`enforceConditionalRequired` in `OrderValidator`) — a delivery order missing either is rejected before it reaches the DB.

## Gotchas
