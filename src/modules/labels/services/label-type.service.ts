import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { LabelTypeBuilder } from '../builders/label-type.builder';
import { CreateLabelTypeDto } from '../dto/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';

@Injectable()
export class LabelTypeService extends ServiceBase<LabelType>{
  constructor(
    @InjectRepository(LabelType)
    private readonly typeRepo: Repository<LabelType>,
    private readonly typeBuilder: LabelTypeBuilder,
  ){ super(typeRepo, typeBuilder, 'LabelTypeService'); }

  async create(dto: CreateLabelTypeDto): Promise<LabelType | null> {
      const item = await this.typeBuilder.buildCreateDto(dto);
      return await this.typeRepo.save(item);
  }
  
  async update(id: number, dto: UpdateLabelTypeDto): Promise<LabelType | null> {
      const toUpdate = await this.findOne(id);
      if(!toUpdate){ return null; }

      await this.typeBuilder.buildUpdateDto(toUpdate, dto);
      
      return await this.typeRepo.save(toUpdate);
  }

  async findOneByName(name: string, relations?: Array<keyof LabelType>): Promise<LabelType | null> {
      return await this.typeRepo.findOne({ where: { name: name }, relations });
  }
}