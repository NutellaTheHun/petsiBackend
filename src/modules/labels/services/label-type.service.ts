import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { LabelTypeBuilder } from '../builders/label-type.builder';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeValidator } from '../validators/label-type.validator';

@Injectable()
export class LabelTypeService extends ServiceBase<LabelType>{
  constructor(
    @InjectRepository(LabelType)
    private readonly typeRepo: Repository<LabelType>,
    typeBuilder: LabelTypeBuilder,
    validator: LabelTypeValidator,
  ){ super(typeRepo, typeBuilder, validator, 'LabelTypeService'); }

  async findOneByName(name: string, relations?: Array<keyof LabelType>): Promise<LabelType | null> {
      return await this.typeRepo.findOne({ where: { name: name }, relations });
  }
}