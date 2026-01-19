import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Unit of measure with this name already exists.',
      id,
    );

    // abbreviation exists
    await this.helper.enforceUnique(
      dto.abbreviation,
      this.repo,
      'abbreviation',
      results,
      'abbreviation with this name already exists.',
      id,
    );

    if (dto.conversionFactorToBase) {
      this.helper.enforcePositive(
        dto.conversionFactorToBase,
        'conversionFactorToBase',
        results,
        'conversion factor cannot be 0',
        id,
      );
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateUnitOfMeasureDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Unit of measure with this name already exists.',
        id,
      );
    }

    // abbreviation exists
    if (dto.abbreviation) {
      await this.helper.enforceUnique(
        dto.abbreviation,
        this.repo,
        'abbreviation',
        results,
        'abbreviation with this name already exists.',
        id,
      );
    }

    if (dto.conversionFactorToBase) {
      this.helper.enforcePositive(
        dto.conversionFactorToBase,
        'conversionFactorToBase',
        results,
        'conversion factor must be greater than 0',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
