import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Big from "big.js";
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { UnitOfMeasureBuilder } from '../builders/unit-of-measure.builder';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureValidator } from '../validators/unit-of-measure.validator';

@Injectable()
export class UnitOfMeasureService extends ServiceBase<UnitOfMeasure> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,

    @Inject(forwardRef(() => UnitOfMeasureBuilder))
    unitBuilder: UnitOfMeasureBuilder,

    validator: UnitOfMeasureValidator,

    requestContextService: RequestContextService,

    logger: AppLogger,
  ){ super(unitRepo, unitBuilder, validator, 'UnitOfMeasureService', requestContextService, logger); }

  async findOneByName(unitName: string, relations?: Array<keyof UnitOfMeasure>): Promise<UnitOfMeasure | null> {
    return await this.unitRepo.findOne({ where: { name: unitName }, relations });
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