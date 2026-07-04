---
module: src/modules/recipes
last_reviewed: 2026-07-04
---

## Overview

Manages recipes and their supporting taxonomy: `Recipe`, `RecipeCategory`, `RecipeSubCategory`, and `RecipeIngredient`.

- A `Recipe` holds a list of `RecipeIngredient`s plus yield/serving/pricing details (`batchResultQuantity`/`batchResultUnit`, `servingSizeQuantity`/`servingSizeUnit`, `salesPrice`). It optionally has a 1:1 link to a `MenuItem` (`producedMenuItem`) it produces, and optionally belongs to a `RecipeCategory` and `RecipeSubCategory`.
- A `Recipe` can itself be used as an ingredient in another recipe when `isIngredient` is true (e.g. "Apple Mix" is a sub-recipe used inside "Classic Apple Pie").
- `RecipeIngredient` is the join entity for a recipe's ingredient list: each row references either an `InventoryItem` (e.g. "flour") or another `Recipe` (a sub-recipe), never both, plus a `quantity`/`unit`.
- `RecipeCategory` (e.g. "Pie") owns a list of `RecipeSubCategory` (e.g. "Sweet Pie", "Savory Pie"); `Recipe.subCategory` must belong to `Recipe.category`.
- `RecipeSubCategory` is dual-purpose: it has its own controller/service/validator for standalone CRUD, and is also composed as a nested child of `RecipeCategory` via the shared `RecipeSubCategoryComposer`.
- Depends on `inventory-items` (ingredient source) and `menu-items` (produced output) modules.

## Enforced Patterns

- **Ingredient source is exclusive-or**: `RecipeIngredientValidator` calls `enforceOnlyOne(identity, 'ingredientInventoryItem', 'ingredientRecipe', ...)` — exactly one of the two must be set, never both, never neither (`validators/recipe-ingredient.validator.ts:81-86`).
- **Sub-recipes must be flagged as ingredients**: when `ingredientRecipe` is set, the validator loads that recipe and rejects it if `isIngredient` is false — a recipe can't be nested as an ingredient unless it's explicitly marked as usable that way (`validators/recipe-ingredient.validator.ts:58-61`).
- **No self-referential ingredients**: `RecipeValidator` rejects an ingredient list entry whose `ingredientRecipe` equals the parent recipe's own id (`validators/recipe.valdiator.ts:145-149`).
- **subCategory requires category, and must belong to it**: setting `subCategoryId` without `categoryId` is an `INVALID_PROPERTY_VALUE` error; when both are set, `enforceValidSize` checks the subcategory is actually in that category's `subCategories` collection (`validators/recipe.valdiator.ts:104-117`). In `RecipeService.updateEntity`, changing `categoryId` without also specifying `subCategoryId` clears `subCategory` to null, since a stale subcategory from the old category would otherwise dangle (`services/recipe.service.ts:99-111`).
- **Yield/serving pairs are mutually required**: `batchResultQuantity`/`batchResultUnit` and `servingSizeQuantity`/`servingSizeUnit` are each enforced as all-or-nothing pairs via `enforceMutualRequired` — you can't set the quantity without the unit or vice versa (`validators/recipe.valdiator.ts:119-133`).
- **Positive-value constraints are doubled up**: `Recipe` has DB-level `@Check` constraints (`batchResultQuantity >= 1`, `servingSizeQuantity >= 1`, `salesPrice >= 0`) in the entity (`entities/recipe.entity.ts:75,113,143`) in addition to `enforcePositive` validator checks — both layers must be kept in sync if these rules change.
- **RecipeSubCategory name uniqueness is scoped to its parent category, not global**: the sub-category validator explicitly skips the standalone `enforceUnique` check (commented out) and instead checks for name collisions only among the parent category's existing `subCategories`, and also rejects a sub-category sharing its parent category's name (`validators/recipe-sub-category.validator.ts:37-70`).
- **Nested composer reused for both standalone and nested writes**: `RecipeSubCategoryComposer` backs both `RecipeSubCategoryService` (standalone CRUD) and `RecipeCategoryService`'s nested `composeManyNestedEntity` calls — same create/update logic either way, only `resolveCreateDto`'s context (`parentCategoryId`) differs (`services/recipe-sub-category.service.ts:39-55`, `services/recipe-category.service.ts:49-61`).
- **Ingredient list reconciliation on Recipe update**: `RecipeService.updateEntity` diffs incoming `dto.ingredients` ids against existing `RecipeIngredient` rows for the recipe, deletes rows whose ids are no longer present, then recomposes the remainder via `RecipeIngredientComposer.composeManyNestedEntity` — don't bypass this by writing to `entity.ingredients` directly (`services/recipe.service.ts:162-186`).
- **Change detection needs relations preloaded**: `getUpdateDiffRelations()` on `RecipeService` must list every relation the change detector diffs (`producedMenuItem`, `category`, `subCategory`, `ingredients`, `ingredients.ingredientInventoryItem`, `ingredients.ingredientRecipe`) — omitting one means `ChangeDetectorBase` can't see changes there and updates on that field will be silently skipped (`services/recipe.service.ts:247-256`).
- **Cascade/nullify rules on delete**: deleting an `InventoryItem` or a `Recipe` used as `ingredientRecipe` cascades deletion of the referencing `RecipeIngredient` rows (`onDelete: 'CASCADE'`); deleting a `MenuItem` nulls `producedMenuItem`; deleting a `RecipeCategory`/`RecipeSubCategory` nulls the recipe's `category`/`subCategory` rather than deleting the recipe (`entities/recipe.entity.ts:56,168-186`, `entities/recipe-ingredient.entity.ts:48,67`).

## Gotchas
