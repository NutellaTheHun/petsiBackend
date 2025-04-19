import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemService } from "../services/inventory-item.service";

@Injectable()
export class InventoryItemVendorBuilder extends BuilderBase<InventoryItemVendor>{
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ) { super(InventoryItemVendor); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public inventoryItemsByIds(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'items', ids);
    }

    public async buildCreateDto(dto: CreateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        /*if(dto.inventoryItemIds){
            this.inventoryItemsByIds(dto.inventoryItemIds);
        }*/

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryItemVendor, dto: UpdateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsByIds(dto.inventoryItemIds);
        }

        return await this.build();
    }
}