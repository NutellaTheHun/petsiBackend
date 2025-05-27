import { ObjectLiteral, Repository } from "typeorm";
import { InventoryItemSize } from "../modules/inventory-items/entities/inventory-item-size.entity";
import { MenuItemSize } from "../modules/menu-items/entities/menu-item-size.entity";
import { DatabaseError } from "./exceptions/database-error";

export class ValidatorHelper {
    /**
     * Validates that the given size is within the list of sizes
     * 
     * @param sizeToValidateId The id of either {@link MenuItemSize} or {@link InventoryItemSize }
     * 
     * @param sizeList 
     * An array of either {@link MenuItemSize} or {@link InventoryItemSize }
     * 
     * @returns true if sizeList contains sizeToValidate, false if not found.
     */
    public isValidSize(sizeToValidateId: number, sizeList: MenuItemSize[] | InventoryItemSize[] | number[]): boolean {
        if (Array.isArray(sizeList) && sizeList.length > 0 && typeof sizeList[0] === 'number') {
            return sizeList.some(sizeId => sizeId === sizeToValidateId);
        }
        return sizeList.some(size => size.id === sizeToValidateId);
    }

    public findDuplicates<T>(
        items: T[],
        getCompositeKey: (item: T) => string
    ): T[] {
        const seen = new Map<string, T[]>();
        const duplicates: T[] = [];

        for (const item of items) {
            const key = getCompositeKey(item);

            if (seen.has(key)) {
                if (seen.get(key)?.length === 1) {
                    duplicates.push(item);
                    const list = seen.get(key)!;
                    list.push(item);
                    seen.set(key, list);
                }
            } else {
                seen.set(key, [item]);
            }
        }

        return duplicates;
    }

    public async exists<T extends ObjectLiteral, K extends keyof T>(
        repo: Repository<T>,
        prop: K,
        input: string
    ): Promise<boolean> {
        try {
            const exists = await repo.findOne({ where: { [prop]: input } as any });
            return exists !== null;
        } catch (err) {
            throw DatabaseError.fromTypeOrmError(err);
        }
    }
}