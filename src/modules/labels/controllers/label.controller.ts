import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LabelService } from '../services/label.service';
import { CreateLabelDto } from '../dto/create-label.dto';
import { UpdateLabelDto } from '../dto/update-label.dto';

@Controller('labels')
export class LabelController {
  constructor(private readonly labelsService: LabelService) {}

  @Post()
  create(@Body() createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @Get()
  findAll() {
    return this.labelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.labelsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto) {
    return this.labelsService.update(+id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labelsService.remove(+id);
  }
}
