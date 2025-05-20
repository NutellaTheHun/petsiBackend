import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { UpdateChildInventoryAreaItemDto } from "../dto/inventory-area-item/update-child-inventory-area-item.dto";

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly repo: Repository<InventoryAreaItem>,

        @Inject(forwardRef(() => InventoryAreaItemService))
        private readonly areaItemService: InventoryAreaItemService,
        
        private readonly itemService: InventoryItemService, 
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryAreaItemDto): Promise<string | null> {
        if(!dto.countedItemSizeId && !dto.countedItemSizeDto){
            return 'inventory area item create dto requires InventoryItemSize id or CreateInventoryItemSizeDto';
        }
        else if(dto.countedItemSizeId && dto.countedItemSizeDto){
            return 'inventory area item create dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto';
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryAreaItemDto | UpdateChildInventoryAreaItemDto): Promise<string | null> {
        // Cannot update with both item size and item size dto
        if(dto.countedItemSizeId && dto.countedItemSizeDto){
            return 'inventory area item update dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto';
        }
        // cannot update item with no sizing
        else if(dto.countedInventoryItemId && !dto.countedItemSizeId && !dto.countedItemSizeDto){
            return 'updating inventory item must be accompanied by updated sizing';
        }
        // item size must be valid for counted inventory item
        else if(dto.countedInventoryItemId && dto.countedItemSizeId){
            const item = await this.itemService.findOne(dto.countedInventoryItemId, ['itemSizes']);

            if(!item.itemSizes.find(size => size.id === dto.countedItemSizeId)){
                return 'inventoryItemSize given is not valid for the inventory item.'
            }
        }
        // if updating size to current item
        else if(dto.countedItemSizeId){
            const currentItem = (await this.areaItemService.findOne(id, ['countedItem'], ['countedItem.itemSizes'])).countedItem
            if(!currentItem){ throw new Error('current item is null'); }
            if(!currentItem.itemSizes){ throw new Error('sizes are null'); }

            if(!currentItem.itemSizes.find(size => size.id === dto.countedItemSizeId)){
                return 'inventoryItemSize given is not valid for the current inventory item.'
            }
        }

        return null;
    }
}