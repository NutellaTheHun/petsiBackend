import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItem } from "../entities/inventory-item.entity";
import { CreateDefaultInventoryItemDtoValues, CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { DRY_A, DRY_B, DRY_C, DRYGOOD_CAT, FOOD_A, FOOD_B, FOOD_C, FOOD_CAT, OTHER_A, OTHER_B, OTHER_C, OTHER_CAT, VENDOR_A, VENDOR_B, VENDOR_C } from "../utils/constants";

@Injectable()
export class InventoryItemFactory extends EntityFactory<InventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto>{

    constructor(
        @Inject(forwardRef(() => InventoryItemCategoryService))
        private readonly categoryService: InventoryItemCategoryService,

        @Inject(forwardRef(() => InventoryItemVendorService))
        private readonly vendorService: InventoryItemVendorService,
    ) {
        super( InventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto, CreateDefaultInventoryItemDtoValues());
    }

    getDefaultRoles(): InventoryItem[] {
        return [

        ];
    }
    
    /**
     * Doesnt set item sizes, returns 9 items, vendor: vendorA-B, categories: food, dry goods, others
     * @returns 
     */
    async getTestingRoles(): Promise<InventoryItem[]> {
        const vendorA = await this.vendorService.findOneByName(VENDOR_A);
        const vendorB = await this.vendorService.findOneByName(VENDOR_B);
        const vendorC = await this.vendorService.findOneByName(VENDOR_C);

        const foodCat = await this.categoryService.findOneByName(FOOD_CAT);
        const dryGoodsCat = await this.categoryService.findOneByName(DRYGOOD_CAT);
        const otherCat = await this.categoryService.findOneByName(OTHER_CAT);

        return [
            this.createEntityInstance({ name: FOOD_A, category: foodCat, vendor: vendorA }),
            this.createEntityInstance({ name: DRY_A, category: dryGoodsCat, vendor: vendorA }),
            this.createEntityInstance({ name: OTHER_A, category: otherCat, vendor: vendorA }),

            this.createEntityInstance({ name: FOOD_B, category: foodCat, vendor: vendorB }),
            this.createEntityInstance({ name: DRY_B, category: dryGoodsCat, vendor: vendorB }),
            this.createEntityInstance({ name: OTHER_B, category: otherCat, vendor: vendorB }),

            this.createEntityInstance({ name: FOOD_C, category: foodCat, vendor: vendorC }),
            this.createEntityInstance({ name: DRY_C, category: dryGoodsCat, vendor: vendorC }),
            this.createEntityInstance({ name: OTHER_C, category: otherCat, vendor: vendorC }),
        ];
    }  
}