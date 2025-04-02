import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemService } from "../services/inventory-item.service";

@Injectable()
export class InventoryItemCategoryBuilder extends BuilderBase<InventoryItemCategory> {
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ){ super(InventoryItemCategory); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public inventoryItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService),'items', ids);
    }

    public async buildCreateDto(dto: CreateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsById(dto.inventoryItemIds);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryItemCategory, dto: UpdateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsById(dto.inventoryItemIds);
        }

        return await this.build();
    }
}