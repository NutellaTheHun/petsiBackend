import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryItemBuilder } from "./inventory-item.builder";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemService } from "../services/inventory-item.service";
import { CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/update-inventory-item-vendor.dto";

@Injectable()
export class InventoryItemVendorBuilder {
    private vendor: InventoryItemVendor;

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ) { this.reset(); }

    public reset(): this {
        this.vendor = new InventoryItemVendor;
        return this
    }

    public name(name: string): this {
        this.vendor.name = name;
        return this;
    }

    public async inventoryItemsByIds(ids: number[]): Promise<this> {
        this.vendor.items = await this.itemService.findEntitiesById(ids);
        return this;
    }

    public getVendor(): InventoryItemVendor {
        const result = this.vendor;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        if(dto.inventoryItemIds){
           await this.inventoryItemsByIds(dto.inventoryItemIds);
        }

        return this.getVendor();
    }

    public updateVendor(toUpdate: InventoryItemVendor): this {
        this.vendor = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryItemVendor, dto: UpdateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        this.reset();

        this.updateVendor(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }

        if(dto.inventoryItemIds){
           await this.inventoryItemsByIds(dto.inventoryItemIds);
        }

        return this.getVendor();
    }
}