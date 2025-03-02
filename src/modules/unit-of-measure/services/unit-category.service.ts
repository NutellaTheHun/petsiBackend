import { forwardRef, Inject, Injectable } from '@nestjs/common';
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

      @Inject(forwardRef(() => UnitOfMeasureService))
      private readonly unitService: UnitOfMeasureService,
  ){ super(categoryRepo); }
  
  async create(createDto: CreateUnitCategoryDto): Promise<UnitCategory | null> {
    const exists = await this.categoryRepo.findOne({ where: { name: createDto.name }});
    if(exists){ return null; } 

    const category = this.categoryFactory.createEntityInstance(createDto);
    if(createDto.unitOfMeasureIds){
      category.units = await this.unitService.findEntitiesById(createDto.unitOfMeasureIds);
    }
    if(createDto.baseUnitId){
      category.baseUnit = await this.unitService.findOne(createDto.baseUnitId);
    }

    const result = await this.categoryRepo.save(category);
    return result;
  }

  async findOneByName(categoryName: string, relations?: string[]): Promise<UnitCategory | null> {
    return this.categoryRepo.findOne({ where: { name: categoryName }, relations });
  }

  /**
  * Id currently not used, using Repository.save for lifecycle hooks
  * @param id currently not used, using Repository.save for lifecycle hooks
  * @param updateDto
  */
  async update(id: number, updateDto: UpdateUnitCategoryDto, relations?: string[]): Promise<UnitCategory | null> {
    const category = await this.categoryRepo.findOne({ where: { id }, relations });
    if(!category) { return null; }

    if(updateDto.name){
      category.name = updateDto.name;
    }

    
    if (updateDto.unitOfMeasureIds) {
        category.units = await this.unitService.findEntitiesById(updateDto.unitOfMeasureIds);
    }

    
    if (updateDto.baseUnitId) {
        const baseUnit = await this.unitService.findOne(updateDto.baseUnitId);
        if(!baseUnit) { throw new Error(`base unit with id:${updateDto.baseUnitId} was not found.`); }
        category.baseUnit = baseUnit;
    }
    
    return await this.categoryRepo.save(category);
  }

  async initializeDefaultCategories(): Promise<void> {
    const categories = await this.categoryFactory.getDefaultRoles()
    await Promise.all(
      categories.map( category => 
        this.create(
          this.categoryFactory.createDtoInstance({ name: category.name })
        )
      )
    );
  }

  async initializeDefaultCategoryBaseUnits(): Promise<void> {
    await this.setCategoryBaseUnit(WEIGHT, GRAM);
    await this.setCategoryBaseUnit(VOLUME, MILLILITER);
    await this.setCategoryBaseUnit(UNIT, UNIT);
  }

  
  async setCategoryBaseUnit(categoryName: string, baseUnitOfMeasure: string): Promise<void> {
    const category = await this.findOneByName(categoryName);
    if(!category){ throw new Error(`${categoryName} category not found.`); }

    const baseUnit = await this.unitService.findOneByName(baseUnitOfMeasure, ['category']);
    if(!baseUnit){ throw new Error("base unit not found"); }
    category.baseUnit = baseUnit;
    
    await this.update(category.id, {
      name: category.name,
      baseUnitId: category.baseUnit.id
    });
  }
}