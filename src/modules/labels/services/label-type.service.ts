import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { LabelTypeBuilder } from '../builders/label-type.builder';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeValidator } from '../validators/label-type.validator';

@Injectable()
export class LabelTypeService extends ServiceBase<LabelType>{
  constructor(
    @InjectRepository(LabelType)
    private readonly typeRepo: Repository<LabelType>,

    typeBuilder: LabelTypeBuilder,

    validator: LabelTypeValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ){ super(typeRepo, typeBuilder, validator, 'LabelTypeService', requestContextService, logger); }

  async findOneByName(name: string, relations?: Array<keyof LabelType>): Promise<LabelType | null> {
      return await this.typeRepo.findOne({ where: { name: name }, relations });
  }
}