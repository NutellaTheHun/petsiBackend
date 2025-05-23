import { resourceLimits } from "worker_threads";
import { InventoryItemSize } from "../modules/inventory-items/entities/inventory-item-size.entity";
import { MenuItemContainerRule } from "../modules/menu-items/entities/menu-item-container-rule.entity";
import { MenuItemSize } from "../modules/menu-items/entities/menu-item-size.entity";
import { ObjectLiteral, Repository } from "typeorm";

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
        if(Array.isArray(sizeList) && sizeList.length > 0 &&  typeof sizeList[0] === 'number'){ 
            return sizeList.some(sizeId => sizeId === sizeToValidateId); 
        }
        return sizeList.some(size => size.id === sizeToValidateId);
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

    public findDuplicates<T>(
        items: T[],
        getCompositeKey: (item: T) => string
    ): T[] {
        const seen = new Map<string, T[]>();
        const duplicates: T[] = [];

        for (const item of items) {
            const key = getCompositeKey(item);
            
            if (seen.has(key)){
                if(seen.get(key)?.length === 1){
                    duplicates.push(item);
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
        const exists = await repo.findOne({ where: { [prop]: input } as any});
        return exists !== null;
    }
}


// Check Duplicates WITH COMPOSITE
/**

                const resolvedDtos: {updateId: number}[] = [];
                for(const d of dto.itemCountDtos){
                    if(d.mode === 'update'){
                        resolvedDtos.push({ updateId: d.id});
                    }
                }

                const hasDuplateIds = this.helper.hasDuplicatesByComposite(
                    resolvedDtos,
                    (resolved) => `${resolved.updateId}`
                );
                if(hasDuplateIds){
                    return `multiple update dtos for same id`;
                }
        

                const resolvedDtos: { menuItemId: number; menuItemSizeId: number }[] = [];
                for(const d of dto.orderedMenuItemDtos){
                    if(d.mode === 'create'){
                        resolvedDtos.push({ menuItemId: d.menuItemId, menuItemSizeId: d.menuItemSizeId});
                    }
                    
                    else if(d.mode === 'update'){
                        const updateDto = d as UpdateChildOrderMenuItemDto;
                        const currentItem = await this.itemService.findOne(updateDto.id, ['menuItem', 'size']);
    
                        resolvedDtos.push({
                            menuItemId: updateDto.menuItemId ?? currentItem.menuItem.id,
                            menuItemSizeId: updateDto.menuItemSizeId ?? currentItem.size.id,
                        });
                    }
                }
                
                // Check resolved dtos for duplicate
                const duplicateItems = this.helper.hasDuplicatesByComposite(
                    resolvedDtos,
                    (item) => `${item.menuItemId}:${item.menuItemSizeId}`
                );
                if(duplicateItems){
                    return 'orderedMenuItemDtos contains duplicate menuItem/size combinations';
                }

DUPLICATES NO COMPOSITE

        if(dto.subCategoryDtos){
            const duplicateSubCats = this.helper.hasDuplicatesByComposite(
                dto.subCategoryDtos,
                (item) => `${item.subCategoryName}`
            );
            if(duplicateSubCats){
                return 'category has duplicate subcategories (same name)';
            }
        }
 * 
 */

// Check Exists
/**
 *  const exists = await this.areaRepo.findOne({ where: { areaName: dto.areaName }});
    if(exists) { 
        return `Inventory with name ${dto.areaName} already exists`; 
    }

    if(dto.unitName){
            const exists = await this.repo.findOne({ where: { name: dto.unitName }});
            if(exists) { 
                return `Unit of measure with name ${dto.unitName} already exists`; 
            }
        }
    if(dto.abbreviation){
        const abbrevExists = await this.repo.findOne({ where: { abbreviation: dto.abbreviation }});
        if(abbrevExists) { 
            return `Unit of measure with abbreviation ${dto.abbreviation} already exists`; 
        }
    }
 */


// Optional Properties but have some requirements
/**
 * // requires ParentContainer id to validate contained item and size (needs to get container rules)
        if(dto.containedMenuItemId && dto.containedMenuItemSizeId && !dto.parentContainerMenuItemId){
            return 'dto requires the parentContainerMenuItemId for validation';
        }
        else if(dto.containedMenuItemId && !dto.parentContainerMenuItemId){
            return 'dto requires the parentContainerMenuItemId for validation';
        }
        else if(dto.containedMenuItemSizeId && !dto.parentContainerMenuItemId){
            return 'dto requires the parentContainerMenuItemId for validation';
        }
 */

// option properties where only one is valid, updating to the other, passing null check
/**
 * if(dto.ingredientInventoryItemId || dto.ingredientRecipeId){
            const currentIngred = await this.repo.findOne({ where: { id }, relations: ['ingredientInventoryItem', 'ingredientRecipe']});

            if(dto.ingredientInventoryItemId && currentIngred?.ingredientRecipe){
                if(dto.ingredientRecipeId !== null){
                    return 'current ingredient has a recipe reference, set to null before updating to inventoryItemIngredient';
                }
            }
            
            if(dto.ingredientRecipeId && currentIngred?.ingredientInventoryItem){
                if(dto.ingredientInventoryItemId !== null){
                    return 'current ingredient has a inventoryitem reference, set to null before updating to reference a recipe as ingredient.';
                }
            }
        }
 */