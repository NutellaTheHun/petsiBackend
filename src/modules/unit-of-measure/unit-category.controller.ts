import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { UnitCategory } from './entities/unit-category.entity';
import { UnitCategoryService } from './unit-category.service';
import { CreateUnitCategoryDto } from './dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from './dto/update-unit-category.dto';


@Controller('unit-category')
export class UnitCategoryController {
    constructor(
        private readonly unitService: UnitCategoryService
      ) {}
    
      @Post()
      async create(@Body() createRoleDto: CreateUnitCategoryDto): Promise<UnitCategory | null> {
        return await this.unitService.create(createRoleDto);
      }
    
      @Get()
      async findAll(): Promise<UnitCategory[]> {
        return await this.unitService.findAll();
      }
    
      @Get(':id')
      async findOne(@Param('id', ParseIntPipe) id: number): Promise<UnitCategory | null> {
        return await this.unitService.findOne(id);
      }
    
      @Patch(':id')
      async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateUnitCategoryDto): Promise<UnitCategory | null> {
        return await this.unitService.update(id, updateRoleDto);
      }
    
      @Delete(':id')
      @HttpCode(HttpStatus.NO_CONTENT)
      async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
        return await this.unitService.remove(id);
      }
}
