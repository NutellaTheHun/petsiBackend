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
     * @returns 
     */
    public validateSize(sizeToValidateId: number, sizeList: MenuItemSize[]): boolean {
        return sizeList.some(size => size.id === sizeToValidateId)
    }

    /**
     * Checks for duplicates based on a combination of indexed values across arrays.
     * Example: checkDuplicates([1, 2], [10, 20]) => checks (1-10), (2-20)
     * 
     * @param arrays Arrays of primitive values (must all be the same length)
     * @returns true if any duplicate composite key exists, false otherwise
     */
    public hasDuplicates(...arrays: (string[] | number[])[]): boolean {
        if(arrays.length === 0) return false;

        const length = arrays[0].length;

        if(!arrays.every(arr => arr.length === length)){
            throw new Error('All arrays must have same length')
        }

        const seen = new Set<string>();

        for (let i = 0; i < length; i++) {
            const compositeKey = arrays.map(arr => String(arr[i])).join('-');

            if (seen.has(compositeKey)) {
                return true;
            }

            seen.add(compositeKey);
        }

        return false;
    }

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