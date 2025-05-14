import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
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
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(InventoryItemVendor, 'InventoryItemVendorBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateInventoryItemVendorDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateInventoryItemVendorDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsByIds(dto.inventoryItemIds);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public inventoryItemsByIds(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'items', ids);
    }
}