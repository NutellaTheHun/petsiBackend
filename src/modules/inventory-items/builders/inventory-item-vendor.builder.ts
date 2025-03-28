import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemService } from "../services/inventory-item.service";

@Injectable()
export class InventoryItemVendorBuilder {
    private vendor: InventoryItemVendor;
    private itemMethods: BuilderMethodBase<InventoryItem>;

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ) { 
        this.reset(); 
        this.itemMethods = new BuilderMethodBase(this.itemService, this.itemService.findOneByName.bind(this.itemService));
    }

    public reset(): this {
        this.vendor = new InventoryItemVendor;
        return this
    }

    public name(name: string): this {
        this.vendor.name = name;
        return this;
    }

    public async inventoryItemsByIds(ids: number[]): Promise<this> {
        await this.itemMethods.entityByIds(
            (items) => { this.vendor.items = items},
            ids,
        )
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