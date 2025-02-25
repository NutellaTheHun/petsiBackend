import { Body, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";

export class InventoryItemPackagesController {
    constructor(){}

    @Post()
      async create(@Body() createRoleDto: CreateInventoryItemPackageDto)/* : Promise<InventoryItemPackage | null>*/ {
        
    }
    
    @Get()
    async findAll()/*: Promise<InventoryItemPackage[]> */{

    }
    
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number)/*: Promise<InventoryItemPackage | null>*/ {
    
    }
    
    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateInventoryItemPackageDto)/*: Promise<InventoryItemPackage | null>*/ {
    
    }
    
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number)/*: Promise<Boolean> */{
    
    }
}