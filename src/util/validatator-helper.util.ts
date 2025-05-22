import { MenuItemContainerRule } from "../modules/menu-items/entities/menu-item-container-rule.entity";
import { MenuItemSize } from "../modules/menu-items/entities/menu-item-size.entity";

export class ValidatorHelper {
    /**
     * Validates that the given size is within the list of sizes
     * 
     * @param sizeToValidateId Either id of the current {@link MenuItemSize} within {@link OrderContainerItem}
     * 
     * or id of the incoming {@link MenuItemSize} from the DTO's containeMenuItemSizeId property.
     * 
     * @param sizeList 
     * Either the array of validSizes from the current {@link MenuItem} within {@link OrderContainerItem}
     * 
     * or array of validSizes from the {@link MenuItemContainerRule}
     * @returns true if sizeList contains sizeToValidate, false if not found.
     */
    public validateSize(sizeToValidateId: number, sizeList: MenuItemSize[]): boolean {
        return sizeList.some(size => size.id === sizeToValidateId)
    }

    /**
     * Checks for duplicates by passing a array of objects and passing a function to create a unique key for each.
     * @param items any array of objects
     * @param getCompositeKey the unique identifier accross the array
     * 
     * for example: an array of inventory item sizes, identify unique sizes with the key "${packageTypeId}:${MeasureUnitId}"
     * @returns true if all unique, false if duplicate found.
     */
    public hasDuplicatesByComposite<T>(
        items: T[],
        getCompositeKey: (item: T) => string
    ): boolean {
        const seen = new Set<string>();
        for (const item of items) {
            const key = getCompositeKey(item);
            if (seen.has(key)) return true;
            seen.add(key);
        }
        return false;
    }
}