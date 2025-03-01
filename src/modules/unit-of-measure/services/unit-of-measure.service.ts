import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { UnitCategoryService } from './unit-category.service';
import { ServiceBase } from '../../../base/service-base';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureFactory } from '../factories/unit-of-measure.factory';
import { CreateUnitOfMeasureDto } from '../dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';
import Big from "big.js";


@Injectable()
export class UnitOfMeasureService extends ServiceBase<UnitOfMeasure> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,

    private readonly unitFactory: UnitOfMeasureFactory,

    @Inject(forwardRef(() => UnitCategoryService))
    private readonly categoryService: UnitCategoryService,
  ){ super(unitRepo); }

  async create(createDto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
    const alreadyExists = await this.unitRepo.findOne({ where: { name: createDto.name }});
    if(alreadyExists){ return null; }

    const unit = await this.unitFactory.createEntityInstance(
      createDto, 
    );

    if(createDto.categoryId){
      const category = await this.categoryService.findOne(createDto.categoryId);
      if(!category){ throw new Error(`category with id ${createDto.categoryId} was not found.`); }
      unit.category = category;
    }

    return await this.unitRepo.save(unit);
  }

  async findOneByName(unitName: string, relations?: string[]): Promise<UnitOfMeasure | null> {
    return await this.unitRepo.findOne({ where: { name: unitName }, relations });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param UnitOfMeasureDto 
   */
  async update(id: number, updateDto: UpdateUnitOfMeasureDto, relations?: string[]): Promise<UnitOfMeasure | null> {
    const unit = await this.unitRepo.findOne({ where: { id }, relations});
    if(!unit){ return null; } //more detailed error

    if(updateDto.name){
      unit.name = updateDto.name;
    }

    if(updateDto.abbreviation){
      unit.abbreviation = updateDto.abbreviation;
    }

    if(updateDto.categoryId){
      const category =  await this.categoryService.findOne(updateDto.categoryId);
      if(!category) { throw new Error(`category with id:${updateDto.categoryId} was not found`); }
      unit.category = category
    }

    if(updateDto.conversionFactorToBase){
      unit.conversionFactorToBase = updateDto.conversionFactorToBase;
    }
  
    return this.unitRepo.save(unit);
  }

  convert(unitAmount: Big, inputUnitType: UnitOfMeasure, outputUnitType: UnitOfMeasure): Big {
    if (!inputUnitType.conversionFactorToBase || !outputUnitType.conversionFactorToBase) {
      throw new Error("Both units must have conversion factors to base.");
    }

    if (inputUnitType.category !== outputUnitType.category) {
      throw new Error("Both units must be in the same category to convert.");
    }

    const baseAmount = new Big(unitAmount).times(new Big(inputUnitType.conversionFactorToBase));

    const targetAmount = baseAmount.div(new Big(outputUnitType.conversionFactorToBase));

    return targetAmount;
  }

  /**
   * Requires default categories to already exist in the database
   */
  async initializeDefaultUnits(): Promise<void> {
    await this.unitRepo.manager.transaction(async (manager: EntityManager) => {
      const units = await this.unitFactory.getDefaultRoles();
      
      for (const unit of units) {
          const exists = await manager.findOne(UnitOfMeasure, { where: { name: unit.name } });
          if (exists) {
              continue;
          }

          const newUnit = manager.create(UnitOfMeasure, {
              name: unit.name,
              abbreviation: unit.abbreviation,
              categoryId: unit.category.id,
              conversionFactorToBase: unit.conversionFactorToBase,
          });

          await manager.save(newUnit);
      }
    });
  }
}