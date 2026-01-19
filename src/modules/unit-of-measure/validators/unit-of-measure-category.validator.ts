import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import {
  UnitOfMeasureCategory,
  UnitOfMeasureCategoryEntity,
} from '../entities/unit-of-measure-category.entity';

@Injectable()
export class UnitOfMeasureCategoryValidator extends ValidatorBase<UnitOfMeasureCategoryEntity> {
  constructor(
    @InjectRepository(UnitOfMeasureCategory)
    private readonly repo: Repository<UnitOfMeasureCategory>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'UnitOfMeasureCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateUnitOfMeasureCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Category with this name already exists.',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateUnitOfMeasureCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Category with this name already exists.',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
