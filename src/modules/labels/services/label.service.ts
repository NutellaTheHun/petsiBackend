import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { LabelBuilder } from '../builders/label.builder';
import { Label } from '../entities/label.entity';
import { LabelValidator } from '../validators/label.validator';

@Injectable()
export class LabelService extends ServiceBase<Label>{
  constructor(
    @InjectRepository(Label)
    private readonly labelRepo: Repository<Label>,
    labelBuilder: LabelBuilder,
    validator: LabelValidator,
  ){ super(labelRepo, labelBuilder, validator, 'LabelService'); }

  async findByMenuItemId(itemId: number, relations?: Array<keyof Label>): Promise<Label[]> {
    return await this.labelRepo.find({
      where: {
        menuItem: { id: itemId }
      },
      relations,
    });
  }
}