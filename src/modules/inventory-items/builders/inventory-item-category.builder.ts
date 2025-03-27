import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemService } from "../services/inventory-item.service";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";

@Injectable()
export class InventoryItemCategoryBuilder {
    private category: InventoryItemCategory;

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ){ this.reset(); }

    public reset(): this {
        this.category = new InventoryItemCategory();
        return this;
    }

    public name(name: string): this {
        this.category.name = name;
        return this;
    }

    public async inventoryItemsById(ids: number[]): Promise<this> {
        this.category.items = await this.itemService.findEntitiesById(ids);
        return this;
    }

    public getCategory(): InventoryItemCategory {
        const result = this.category;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        this.reset();
        if(dto.name){
            this.name(dto.name);
        }

        if(dto.inventoryItemIds){
            await this.inventoryItemsById(dto.inventoryItemIds);
        }

        return this.getCategory();
    }

    public updateCategory(toUpdate: InventoryItemCategory): this{
        this.category = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryItemCategory, dto: UpdateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        this.reset();

        this.updateCategory(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }

        if(dto.inventoryItemIds){
            await this.inventoryItemsById(dto.inventoryItemIds);
        }

        return this.getCategory();
    }
}