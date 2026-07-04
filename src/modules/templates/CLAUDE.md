---
module: src/modules/templates
last_reviewed: 2026-07-04
---

## Overview

This module manages **Templates** used to print baking-list forms. A `Template` (`entities/template.entity.ts`) is a named form (e.g. "Summer Pies") that owns an ordered list of `TemplateMenuItem` rows (`entities/template-menu-item.entity.ts`), each referencing a `MenuItem` from the `menu-items` module via `menuItem`, plus a `displayName` (label printed on the form) and a `tablePosIndex` (1-based row order, enforced `>= 1` at the DB level via `@Check`). `TemplateMenuItem.parentTemplate` cascades on delete (`onDelete: 'CASCADE'`, `orphanedRowAction: 'delete'`) so removing a `Template` removes its rows.

Per business logic (see entity doc comment), a template represents either pie or pastry products — this is a business convention, not something enforced in code here.

`TemplateService` and `TemplateMenuItemService` both extend `ServiceBase`; `TemplateController` and `TemplateMenuItemController` both extend `ControllerBase`, following the standard module shape described in `src/common/base/CLAUDE.md`.

## Enforced Patterns

- **`TemplateMenuItem` cannot be created or updated directly.** `TemplateMenuItemController.create` and `.update` are both hard-overridden to `throw new Error('Endpoint not available')` (the original `@Post`/`@Put` decorators and bodies are commented out). The only way to create or update rows is through the parent `Template` endpoints (`POST /templates`, `PUT /templates/:id`) using the nested `templateMenuItems` array. Only `GET` and `DELETE` are live on `/template-menu-items`.
- **Row composition goes through `TemplateMenuItemComposer`, not the builders.** `TemplateService.createEntity`/`updateEntity` and `TemplateMenuItemService.createEntity`/`updateEntity` call `TemplateMenuItemComposer.composeManyNestedEntity` / `composeCreate` / `composeUpdate` to build/patch rows inside the transaction. `TemplateBuilder` and `TemplateMenuItemBuilder` (in `builders/`) are registered as providers in `templates.module.ts` but are not invoked anywhere in the service/controller/composer code path — do not assume they run; if adding new create/update logic, extend the composer, not the builder.
- **Nested create vs. update DTOs are distinguished by discriminant field.** `NestedCreateTemplateMenuItemDto` carries `createId` (from `NestedCreateDto`), `NestedUpdateTemplateMenuItemDto` carries `id` (from `NestedUpdateDto`). `UpdateTemplateDto.templateMenuItems` uses a `@Transform` that inspects `'createId' in item` to pick which class to `plainToInstance` into before validation — both shapes travel together in one array. `TemplateMenuItemComposer.resolveCreateDto` requires `context.parentTemplateId` to be present (throws otherwise) when converting a nested-create DTO into a full `CreateTemplateMenuItemDto`.
- **`TemplateService.updateEntity` removes rows omitted from the incoming array.** Any existing `TemplateMenuItem.id` not present in `dto.templateMenuItems` is deleted via `manager.delete(TemplateMenuItem, { id: In(idsToRemove) })` before composing the remaining/new rows — the nested array is treated as the full desired set, not a diff to merge.
- **Uniqueness and identity rules live in the validators, not the entities.** `TemplateValidator.validateIdentity` enforces: unique `Template.name` (`enforceUnique`), no duplicate `menuItemId` among `templateMenuItems`, and no duplicate `tablePosIndex` among `templateMenuItems` (`enforceNoDuplicateElements`, keyed by `id ?? createId`). `TemplateMenuItemValidator.validateIdentity` enforces unique `displayName`, that `menuItemId` and `parentTemplateId` reference existing rows (`enforceExists`), and that `tablePosIndex` is positive. These run whenever `resolveIdentity`/`validateNestedIdentity` is invoked from the parent `TemplateValidator`, so nested rows get validated even though they don't have their own controller create/update path.
- **Change detection is recursive.** `TemplateChangeDetector.detect` diffs `name` directly but delegates each `templateMenuItems` entry to `TemplateMenuItemChangeDetector.detect`: new rows (`createId` present) or rows without a matching existing `id` pass through unchanged; existing rows are only included in the patch if the child detector reports `hasChanges`. `TemplateService.getUpdateDiffRelations()` returns `['templateMenuItems', 'templateMenuItems.menuItem']` so the entity loaded for diffing has what the detector needs.

## Gotchas
