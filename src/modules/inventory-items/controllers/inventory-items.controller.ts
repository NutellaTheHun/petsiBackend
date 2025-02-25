import { Body, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { Controller } from '@nestjs/common';
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";

@Controller('inventory-items')
export class InventoryItemsController {
    constructor(){}
    
    @Post()
        async create(@Body() createRoleDto: CreateInventoryItemDto)/* : Promise<InventoryItem | null>*/ {
        
    }
    
    @Get()
    async findAll()/*: Promise<InventoryItem[]> */{

    }
    
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number)/*: Promise<InventoryItem | null>*/ {
    
    }
    
    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateInventoryItemDto)/*: Promise<InventoryItem | null>*/ {
    
    }
    
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number)/*: Promise<Boolean> */{
    
        }
}
