status: done
blocked-by: [01-dynamic-property-config-crud.md, 02-menu-item-dynamic-property-value-write-path.md]

---

## Source

`prd/dynamic-entity-properties/prd.md`

## What to build

Extend `MenuItemValidator` to validate the `dynamicProperties` array on create and update. Delegate config-aware lookups to helper methods on `DynamicPropertyConfigService` so the logic is reusable and the validator stays thin.

**Checks performed for each entry in `dynamicProperties`:**

1. The `configId` resolves to an existing `DynamicPropertyConfig`.
2. The config's `holderEntityType` matches `"menuItem"`.
3. The config's `holderCategoryId` (if set) matches the `categoryId` of the MenuItem being saved. Use the DTO's `categoryId` for this check on create; on update, fall back to the existing entity's category if `categoryId` is absent from the DTO.
4. When `valueType = "entityReference"` and `value` is non-null: the referenced entity exists and (if `valueEntityCategoryId` is set on the config) belongs to that category. Self-reference (value entity id = menu item id being saved) is out of scope for backend enforcement per the PRD.

**Category-change guard (update only):** If the DTO includes a new `categoryId` that differs from the current entity's category, check whether any existing `MenuItemDynamicPropertyValue` rows for this MenuItem reference configs whose `holderCategoryId` no longer matches the incoming `categoryId`. If any such rows exist, return a validation error — values must be explicitly cleared before the category can be changed.

## Acceptance criteria

- [ ] A valid `dynamicProperties` entry (known config, matching holder category, valid value entity) passes validation and the MenuItem is saved.
- [ ] An unknown `configId` returns a validation error.
- [ ] A config whose `holderCategoryId` does not match the MenuItem's category returns a validation error.
- [ ] A value entity that does not belong to the required `valueEntityCategoryId` returns a validation error.
- [ ] Attempting to change a MenuItem's `categoryId` when existing dynamic property value rows reference configs scoped to the old category returns a validation error.
- [ ] Validator spec tests cover all five cases above, following the pattern in the existing `menu-item.validator.spec.ts`.
