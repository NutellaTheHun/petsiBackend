import { Body, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";

export class InventoryItemSizesController {
    constructor(){}

    @Post()
      async create(@Body() createRoleDto: CreateInventoryItemSizeDto)/* : Promise<InventoryItemSize | null>*/ {
        
    }
    
    @Get()
    async findAll()/*: Promise<InventoryItemSize[]> */{

    }
    
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number)/*: Promise<InventoryItemSize | null>*/ {
    
    }
    
    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateInventoryItemSizeDto)/*: Promise<InventoryItemSize | null>*/ {
    
    }
    
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number)/*: Promise<Boolean> */{
    
    }
}