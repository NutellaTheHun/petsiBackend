import { Body, Controller, forwardRef, Inject, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { InventoryItemSizeController } from "../../inventory-items/controllers/inventory-item-size.controller";

@Controller('inventory-area-item-count')
export class InventoryAreaItemCountController extends ControllerBase<InventoryAreaItemCount> {
    constructor(
        private readonly itemCountService: InventoryAreaItemCountService,

        private readonly itemSizeController: InventoryItemSizeController,
    ){ super(itemCountService); }

    @Post()
    async create(@Body() createDto: CreateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount | null> {
        if(createDto.itemSizeCreateDto && createDto.itemSizeId){
            throw new Error("dto cannot have both a createItemSizeDTO and an itemSizeId");
        }
        if(!createDto.itemSizeCreateDto && !createDto.itemSizeId){
            throw new Error("dto container neither itemSizeCreateDTO or itemSizeId, must have one of either");
        }

        if(createDto.itemSizeCreateDto){
            const newSize = await this.itemSizeController.create(createDto.itemSizeCreateDto);
            if(!newSize){ throw new Error("new item size is null"); }
            if(!newSize?.id){ throw new Error("new item size id is null"); }

            createDto = { ...createDto, itemSizeId: newSize?.id }
        }
        return await this.itemCountService.create(createDto);
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any): Promise<InventoryAreaItemCount | null> {
        if(updateDto.itemSizeCreateDto && updateDto.itemSizeId){
            throw new Error("dto cannot have both a createItemSizeDTO and an itemSizeId");
        }
        if(updateDto.inventoryItemId && !(updateDto.itemSizeId || updateDto.itemSizeCreateDto)){
            throw new Error("dto cannot update the inventory item without itemSizeID or createDTO");
        }

        if(updateDto.itemSizeCreateDto){
            const newSize = await this.itemSizeController.create(updateDto.itemSizeCreateDto);
            if(!newSize){ throw new Error("new item size is null"); }
            if(!newSize?.id){ throw new Error("new item size id is null"); }

            updateDto = { ...updateDto, itemSizeId: newSize?.id }
        }
        return await this.itemCountService.update(id, updateDto);
    }
}