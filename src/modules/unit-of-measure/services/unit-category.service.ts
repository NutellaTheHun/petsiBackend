import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { UnitCategoryBuilder } from '../builders/unit-category.builder';
import { CreateUnitCategoryDto } from '../dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from '../dto/update-unit-category.dto';
import { UnitCategory } from '../entities/unit-category.entity';

@Injectable()
export class UnitCategoryService extends ServiceBase<UnitCategory> {
  constructor(
      @InjectRepository(UnitCategory)
      private readonly categoryRepo: Repository<UnitCategory>,
      private readonly categoryBuilder: UnitCategoryBuilder,
  ){ super(categoryRepo, categoryBuilder, 'UnitCategoryService'); }
  
  async create(createDto: CreateUnitCategoryDto): Promise<UnitCategory | null> {
    const exists = await this.categoryRepo.findOne({ where: { name: createDto.name }});
    if(exists){ return null; }
    
    const category = await this.categoryBuilder.buildCreateDto(createDto);
    await this.categoryRepo.save(category);

    return category;
  }

  async findOneByName(categoryName: string, relations?: Array<keyof UnitCategory>): Promise<UnitCategory | null> {
    return this.categoryRepo.findOne({ where: { name: categoryName }, relations });
  }

  /**
  * Id currently not used, using Repository.save for lifecycle hooks
  * @param id currently not used, using Repository.save for lifecycle hooks
  * @param updateDto
  */
  async update(id: number, updateDto: UpdateUnitCategoryDto, relations?: Array<keyof UnitCategory>): Promise<UnitCategory | null> {
    const category = await this.categoryRepo.findOne({ where: { id }, relations });
    if(!category) { return null; }

    this.categoryBuilder.buildUpdateDto(category, updateDto);
    return await this.categoryRepo.save(category);
  }
}