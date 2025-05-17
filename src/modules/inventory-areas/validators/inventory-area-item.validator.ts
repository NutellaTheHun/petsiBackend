import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item.dto";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";

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
        if(!dto.itemSizeId && !dto.itemSizeDto){
            return 'inventory area item create dto requires InventoryItemSize id or CreateInventoryItemSizeDto';
        }
        else if(dto.itemSizeId && dto.itemSizeDto){
            return 'inventory area item create dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto';
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryAreaItemDto): Promise<string | null> {
        if(dto.itemSizeId && dto.itemSizeDto){
            return 'inventory area item update dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto';
        }
        else if(dto.inventoryItemId && !dto.itemSizeId && !dto.itemSizeDto){
            return 'updating inventory item must be accompanied by updated sizing';
        }
        else if(dto.inventoryItemId && dto.itemSizeId){
            const item = await this.itemService.findOne(dto.inventoryItemId, ['sizes']);
            if(!item.sizes){ throw new Error('item sizes is null'); }

            if(!item.sizes.find(size => size.id === dto.itemSizeId)){
                return 'inventoryItemSize given is not valid for the inventory item.'
            }
        }
        else if(dto.itemSizeId){
            // NEED TO GET CURRENT INVENTORY ITEM FROM INV AREA ITEM
            const currentItem = (await this.areaItemService.findOne(id, ['item'], ['item.sizes'])).item
            if(!currentItem){ throw new Error('current item is null'); }
            if(!currentItem.sizes){ throw new Error('sizes are null'); }

            if(!currentItem.sizes.find(size => size.id === dto.itemSizeId)){
                return 'inventoryItemSize given is not valid for the current inventory item.'
            }
        }

        return null;
    }
}