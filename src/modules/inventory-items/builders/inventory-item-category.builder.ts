import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemService } from "../services/inventory-item.service";
import { InventoryItemCategoryValidator } from "../validators/inventory-item-category.validator";

@Injectable()
export class InventoryItemCategoryBuilder extends BuilderBase<InventoryItemCategory> {
    
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
        validator: InventoryItemCategoryValidator,
    ){ super(InventoryItemCategory, validator); }

    protected async createEntity(dto: CreateInventoryItemCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateInventoryItemCategoryDto): Promise<void> {
         if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsById(dto.inventoryItemIds);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public inventoryItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService),'items', ids);
    }
}