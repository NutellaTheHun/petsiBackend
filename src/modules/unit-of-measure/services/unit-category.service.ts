import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryFactory } from '../factories/unit-category.factory';
import { CreateUnitCategoryDto } from '../dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from '../dto/update-unit-category.dto';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { ServiceBase } from '../../../base/service-base';
import { GRAM, MILLILITER, UNIT, VOLUME, WEIGHT } from '../utils/constants';

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

  async initializeDefaultCategoryBaseUnits(): Promise<void> {
    await this.setCategoryBaseUnit(WEIGHT, GRAM);
    await this.setCategoryBaseUnit(VOLUME, MILLILITER);
    await this.setCategoryBaseUnit(UNIT, UNIT);
  }

  async setCategoryBaseUnit(categoryName: string, baseUnitOfMeasure: string): Promise<void> {
    const category = await this.findOneByName(categoryName);
    if(!category){ throw new Error(`${categoryName} category not found.`); }
    category.baseUnit = await this.unitService.findOneByName(baseUnitOfMeasure);
    await this.update(category.id, category);
  }
}
