import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
    if (await this.helper.exists(this.repo, 'name', dto.unitName)) {
      const err = new ValidationErrorNode(
        'name',
        id,
        'Unit of measure with this name already exists.',
      );
      results.push(err);
    }

    // abbreviation exists
    if (await this.helper.exists(this.repo, 'abbreviation', dto.abbreviation)) {
      const err = new ValidationErrorNode(
        'abbreviation',
        id,
        'abbreviation with this name already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateUnitOfMeasureDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name exists
    if (dto.unitName) {
      if (await this.helper.exists(this.repo, 'name', dto.unitName)) {
        const err = new ValidationErrorNode(
          'name',
          id,
          'Unit of measure with this name already exists.',
        );
        results.push(err);
      }
    }

    // abbreviation exists
    if (dto.abbreviation) {
      if (
        await this.helper.exists(this.repo, 'abbreviation', dto.abbreviation)
      ) {
        const err = new ValidationErrorNode(
          'abbreviation',
          id,
          'abbreviation with this name already exists.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
