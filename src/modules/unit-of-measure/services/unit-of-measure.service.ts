import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    const categoryId = createDto.categoryId;
    const unit = await this.unitFactory.createEntityInstance(
      createDto, 
      { category: await this.categoryService.findOne(categoryId) }
    );

    return await this.unitRepo.save(unit);
  }

  async findOneByName(unitName: string, relations?: string[]): Promise<UnitOfMeasure | null> {
    return await this.unitRepo.findOne({ where: { name: unitName }, relations: relations  });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param UnitOfMeasureDto 
   */
  async update(id: number, updateDto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
    const alreadyExists = await this.unitRepo.findOne({ where: { id }});
    if(!alreadyExists){ return null; } //more detailed error

    const category = updateDto.categoryId
      ? await this.categoryService.findOne(updateDto.categoryId)
      : null;

    const unit = await this.unitFactory.updateEntityInstance(
      updateDto, 
      { categoryId: category?.id }
    );
    
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
    const units = await this.unitFactory.getDefaultRoles();
    await Promise.all(
      units.map((
        unit => this.create(this.unitFactory.createDtoInstance({ 
          name: unit.name,
          abbreviation: unit.abbreviation,
          categoryId: unit.category.id,
          conversionFactorToBase: unit.conversionFactorToBase,
        }))
      ))
    );
  }
}