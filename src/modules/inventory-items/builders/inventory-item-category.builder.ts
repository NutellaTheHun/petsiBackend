import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemService } from "../services/inventory-item.service";
import { InventoryItemCategoryValidator } from "../validators/inventory-item-category.validator";
import { AppLogger } from "../../app-logging/app-logger";

@Injectable()
export class InventoryItemCategoryBuilder extends BuilderBase<InventoryItemCategory> {
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        validator: InventoryItemCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super( InventoryItemCategory, 'InventoryItemCategoryBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateInventoryItemCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateInventoryItemCategoryDto): void {
         if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public inventoryItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService),'items', ids);
    }
}