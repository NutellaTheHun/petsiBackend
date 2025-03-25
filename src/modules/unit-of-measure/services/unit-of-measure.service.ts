import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

    // create initial unit entity
    const unit = await this.unitFactory.createEntityInstance(
      createDto, 
    );

    await this.unitRepo.save(unit);

    // if assigning a category or assigning no category
    if(createDto.categoryId || createDto.categoryId == null){
      const category = await this.categoryService.findOne(createDto.categoryId);
      if(!category){ throw new Error(`category with id ${createDto.categoryId} was not found.`); }
      unit.category = category;
      await this.unitRepo.save(unit);
    }

    return unit;
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
    const unitToUpdate = await this.unitRepo.findOne({ where: { id }, relations});
    if(!unitToUpdate){ return null; } //more detailed error


    if(updateDto.name){
      unitToUpdate.name = updateDto.name;
    }

    if(updateDto.abbreviation){
      unitToUpdate.abbreviation = updateDto.abbreviation;
    }

    if(updateDto.conversionFactorToBase){
      unitToUpdate.conversionFactorToBase = updateDto.conversionFactorToBase;
    }

    if(updateDto.categoryId !== null){
      if(updateDto.categoryId === 0){
        unitToUpdate.category = null;
      } else {
        unitToUpdate.category = await this.categoryService.findOne(updateDto.categoryId as number);
      }
    }
    return await this.unitRepo.save(unitToUpdate);
  }

  convert(unitAmount: Big, inputUnitType: UnitOfMeasure, outputUnitType: UnitOfMeasure): Big {
    if (!inputUnitType.conversionFactorToBase || !outputUnitType.conversionFactorToBase) {
      throw new Error("Both units must have conversion factors to base.");
    }

    if (inputUnitType.category?.id !== outputUnitType.category?.id) {
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
      const units = await this.unitFactory.getDefaultUnits();
      
      for (const unit of units) {
        const exists = await manager.findOne(UnitOfMeasure, { where: { name: unit.name } });
        if (exists) {
            continue;
        }
        
        await this.create(this.unitFactory.createDtoInstance({
            name: unit.name,
            abbreviation: unit.abbreviation,
            categoryId: unit.category?.id,
            conversionFactorToBase: unit.conversionFactorToBase,
        }));
      }
      
    });
  }

  /**
   * Initializes unit of measure entities, for testing purposes. Reqquires default unit Categories to be to be populated.
   */
  async initializeTestingDatabase(): Promise<void> {

    const testUnits = await this.unitFactory.getTestingUnits();
    for(const unit of testUnits){
      await this.create((
        this.unitFactory.createDtoInstance(unit)
      ))
    }
  }
}

