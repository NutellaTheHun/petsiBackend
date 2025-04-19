import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Big from "big.js";
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { UnitOfMeasureBuilder } from '../builders/unit-of-measure.builder';
import { CreateUnitOfMeasureDto } from '../dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureService extends ServiceBase<UnitOfMeasure> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,
    private readonly unitBuilder: UnitOfMeasureBuilder,
  ){ super(unitRepo); }

  async create(createDto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
    const alreadyExists = await this.unitRepo.findOne({ where: { name: createDto.name }});
    if(alreadyExists){ return null; }

    const unit = await this.unitBuilder.buildCreateDto(createDto);
    await this.unitRepo.save(unit);

    return unit;
  }

  async findOneByName(unitName: string, relations?: Array<keyof UnitOfMeasure>): Promise<UnitOfMeasure | null> {
    return await this.unitRepo.findOne({ where: { name: unitName }, relations });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param UnitOfMeasureDto 
   */
  async update(id: number, updateDto: UpdateUnitOfMeasureDto, relations?: Array<keyof UnitOfMeasure>): Promise<UnitOfMeasure | null> {
    const toUpdate = await this.unitRepo.findOne({ where: { id }, relations});
    if(!toUpdate){ return null; } //more detailed error

    await this.unitBuilder.buildUpdateDto(toUpdate, updateDto);
    return await this.unitRepo.save(toUpdate);
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
}