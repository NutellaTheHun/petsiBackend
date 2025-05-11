import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemService } from "../services/inventory-item.service";
import { InventoryItemVendorValidator } from "../validators/inventory-item-vendor.validator";

@Injectable()
export class InventoryItemVendorBuilder extends BuilderBase<InventoryItemVendor>{
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
        validator: InventoryItemVendorValidator,
    ) { super(InventoryItemVendor, validator); }

    protected async createEntity(dto: CreateInventoryItemVendorDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateInventoryItemVendorDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsByIds(dto.inventoryItemIds);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public inventoryItemsByIds(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'items', ids);
    }

    /*public async buildCreateDto(dto: CreateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        
        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryItemVendor, dto: UpdateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        this.reset();
        this.setEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsByIds(dto.inventoryItemIds);
        }

        return await this.build();
    }*/
}