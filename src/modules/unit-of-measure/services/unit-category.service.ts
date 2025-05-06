import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { UnitCategoryBuilder } from '../builders/unit-category.builder';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryValidator } from '../validators/unit-category.validator';

@Injectable()
export class UnitCategoryService extends ServiceBase<UnitCategory> {
  constructor(
      @InjectRepository(UnitCategory)
      private readonly categoryRepo: Repository<UnitCategory>,
      categoryBuilder: UnitCategoryBuilder,
      validator: UnitCategoryValidator,
  ){ super(categoryRepo, categoryBuilder, validator, 'UnitCategoryService'); }

  async findOneByName(categoryName: string, relations?: Array<keyof UnitCategory>): Promise<UnitCategory | null> {
    return this.categoryRepo.findOne({ where: { name: categoryName }, relations });
  }
}