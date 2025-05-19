import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/inventory-item-category/update-inventory-item-category.dto";
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
        if(dto.itemCategoryName){
            this.categoryName(dto.itemCategoryName);
        }
    }

    protected updateEntity(dto: UpdateInventoryItemCategoryDto): void {
         if(dto.itemCategoryName){
            this.categoryName(dto.itemCategoryName);
        }
    }

    public categoryName(name: string): this {
        return this.setPropByVal('categoryName', name);
    }

    public categoryItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'categoryItems', ids);
    }
}