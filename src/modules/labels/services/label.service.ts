import { Injectable } from '@nestjs/common';
import { CreateLabelDto } from '../dto/create-label.dto';
import { UpdateLabelDto } from '../dto/update-label.dto';
import { ServiceBase } from '../../../base/service-base';
import { Label } from '../entities/label.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LabelBuilder } from '../builders/label.builder';

@Injectable()
export class LabelService extends ServiceBase<Label>{
  constructor(
    @InjectRepository(Label)
    private readonly labelRepo: Repository<Label>,
    private readonly labelBuilder: LabelBuilder,
  ){ super(labelRepo, labelBuilder, 'LabelService'); }

  async create(dto: CreateLabelDto): Promise<Label | null> {
      const exists = await this.labelRepo.findOne({ 
        where: {
        menuItem: { id: dto.menuItemId},
        type: { id: dto.typeId}
        }
      });
      if(exists){ return null; }

      const item = await this.labelBuilder.buildCreateDto(dto);
      return await this.labelRepo.save(item);
  }
  
  async update(id: number, dto: UpdateLabelDto): Promise<Label | null> {
      const toUpdate = await this.findOne(id);
      if(!toUpdate){ return null; }

      await this.labelBuilder.buildUpdateDto(toUpdate, dto);
      
      return await this.labelRepo.save(toUpdate);
  }

  async findByMenuItemId(itemId: number, relations?: Array<keyof Label>): Promise<Label[]> {
    return await this.labelRepo.find({
      where: {
        menuItem: { id: itemId }
      },
      relations,
    });
  }
}