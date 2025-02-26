import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';

@Controller('unit-of-measure')
export class UnitOfMeasureController {
    constructor(
        private readonly unitService: UnitOfMeasureService
      ) {}
    
      @Post()
      async create(@Body() createRoleDto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
        return await this.unitService.create(createRoleDto);
      }
    
      @Get()
      async findAll(): Promise<UnitOfMeasure[]> {
        return await this.unitService.findAll();
      }
    
      @Get(':id')
      async findOne(@Param('id', ParseIntPipe) id: number): Promise<UnitOfMeasure | null> {
        return await this.unitService.findOne(id);
      }
    
      @Patch(':id')
      async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
        return await this.unitService.update(id, updateRoleDto);
      }
    
      @Delete(':id')
      @HttpCode(HttpStatus.NO_CONTENT)
      async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
        return await this.unitService.remove(id);
      }
}
