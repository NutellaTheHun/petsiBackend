import { Body, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";

export class InventoryItemCategoriesController {
    constructor(){}

    @Post()
      async create(@Body() createRoleDto: CreateInventoryItemCategoryDto)/* : Promise<InventoryItemCategory | null>*/ {
        
    }
    
    @Get()
    async findAll()/*: Promise<InventoryItemCategory[]> */{

    }
    
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number)/*: Promise<InventoryItemCategory | null>*/ {
    
    }
    
    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateInventoryItemCategoryDto)/*: Promise<InventoryItemCategory | null>*/ {
    
    }
    
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number)/*: Promise<Boolean> */{
    
    }
}