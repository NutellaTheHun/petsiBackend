import { Body, Controller, Inject, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";

@Controller('inventory-area-item')
export class InventoryAreaItemController extends ControllerBase<InventoryAreaItem> {
    constructor(
        private readonly itemCountService: InventoryAreaItemService,
        private readonly itemSizeService: InventoryItemSizeService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        @Inject(Logger)logger: Logger,
    ){ super(itemCountService, cacheManager, logger); }

    /**
     * 
     * @param createDto (areaCountId: number, inventoryAreaId: number, InventoryItemId: number, itemSizeId: number, measureAmount: number, unitAmount: number)
     */
   /* @Post()
    async create(@Body() createDto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem | null> {
        if(createDto.itemSizeDto && createDto.itemSizeId){
            throw new Error("dto cannot have both a createItemSizeDTO and an itemSizeId");
        }
        if(!createDto.itemSizeDto && !createDto.itemSizeId){
            throw new Error("dto container neither itemSizeCreateDTO or itemSizeId, must have one of either");
        }
        return await this.itemCountService.create(createDto);
    }*/

    /**
     * 
     * @param id 
     * @param updateDto (areaCountId: number, inventoryAreaId: number, InventoryItemId: number, itemSizeId: number, measureAmount: number, unitAmount: number)
     * note: if the inventoryItem changes, the itemSize must also change
     */
   /* @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any): Promise<InventoryAreaItem | null> {
        if(updateDto.itemSizeCreateDto && updateDto.itemSizeId){
            throw new Error("dto cannot have both a createItemSizeDTO and an itemSizeId");
        }
        if(updateDto.inventoryItemId && !(updateDto.itemSizeId || updateDto.itemSizeCreateDto)){
            throw new Error("dto cannot update the inventory item without itemSizeID or createDTO");
        }

        if(updateDto.itemSizeCreateDto){
            const newSize = await this.itemSizeService.create(updateDto.itemSizeCreateDto);
            if(!newSize){ throw new Error("new item size is null"); }
            if(!newSize?.id){ throw new Error("new item size id is null"); }

            updateDto = { ...updateDto, itemSizeId: newSize?.id } as UpdateInventoryAreaItemDto;
        }
        return await this.itemCountService.update(id, updateDto);
    }*/
}