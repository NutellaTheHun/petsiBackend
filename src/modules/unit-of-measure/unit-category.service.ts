import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitCategory } from './entities/unit-category.entity';
import { UnitCategoryFactory } from './factories/unit-category.factory';
import { CreateUnitCategoryDto } from './dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from './dto/update-unit-category.dto';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { ServiceBase } from '../../base/service-base';

@Injectable()
export class UnitCategoryService extends ServiceBase<UnitCategory> {
  constructor(
      @InjectRepository(UnitCategory)
      private readonly categoryRepo: Repository<UnitCategory>,
  
      private readonly categoryFactory: UnitCategoryFactory,
  
      private readonly unitService: UnitOfMeasureService,
  ){ super(categoryRepo); }
  
  async create(createDto: CreateUnitCategoryDto): Promise<UnitCategory | null> {
    const exists = await this.categoryRepo.findOne({ where: { name: createDto.name }});
    if(exists){ return null; } 

    const unitOfMeasureIds = createDto.unitOfMeasureIds || [];
    const category = this.categoryFactory.createEntityInstance(
      createDto, 
      { units: this.unitService.findEntitiesById(unitOfMeasureIds) }
    );

    return await this.categoryRepo.save(category);
  }

  async findOneByName(categoryName: string, relations?: string[]): Promise<UnitCategory | null> {
    return this.categoryRepo.findOne({ where: { name: categoryName }, relations: relations });
  }

  /**
  * Id currently not used, using Repository.save for lifecycle hooks
  * @param id currently not used, using Repository.save for lifecycle hooks
  * @param updateDto 
  * @returns 
  */
  async update(id: number, updateDto: UpdateUnitCategoryDto): Promise<UnitCategory | null> {
    const exists = await this.categoryRepo.findOne({ where: { id } });
    if(!exists) { return null; }

    const unitIds = updateDto.unitOfMeasureIds || [];
    const category = this.categoryFactory.updateEntityInstance(
      updateDto, 
      { units: this.unitService.findEntitiesById(unitIds)}
    );

    return this.categoryRepo.save(category);
  }
}
