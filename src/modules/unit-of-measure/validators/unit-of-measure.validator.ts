import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import {
  UnitOfMeasure,
  UnitOfMeasureEntity,
} from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureValidator extends ValidatorBase<UnitOfMeasureEntity> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly repo: Repository<UnitOfMeasure>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'UnitOfMeasure', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateUnitOfMeasureDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // name exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Unit of measure with this name already exists.',
    );

    // abbreviation exists
    await this.helper.enforceUnique(
      dto.abbreviation,
      this.repo,
      'abbreviation',
      errorMap,
      'abbreviation with this name already exists.',
    );

    if (dto.conversionFactorToBase) {
      this.helper.enforcePositive(
        dto.conversionFactorToBase,
        'conversionFactorToBase',
        errorMap,
        'conversion factor cannot be 0',
      );
    }

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateUnitOfMeasureDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // name exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Unit of measure with this name already exists.',
      );
    }

    // abbreviation exists
    if (dto.abbreviation) {
      await this.helper.enforceUnique(
        dto.abbreviation,
        this.repo,
        'abbreviation',
        errorMap,
        'abbreviation with this name already exists.',
      );
    }

    if (dto.conversionFactorToBase) {
      this.helper.enforcePositive(
        dto.conversionFactorToBase,
        'conversionFactorToBase',
        errorMap,
        'conversion factor must be greater than 0',
      );
    }

    return errorMap;
  }
}
