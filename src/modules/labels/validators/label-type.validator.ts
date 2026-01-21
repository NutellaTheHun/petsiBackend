import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType, LabelTypeEntity } from '../entities/label-type.entity';

@Injectable()
export class LabelTypeValidator extends ValidatorBase<LabelTypeEntity> {
  constructor(
    @InjectRepository(LabelType)
    private readonly repo: Repository<LabelType>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'LabelType', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateLabelTypeDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // name
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Item with this name already exists',
    );

    // length
    this.helper.enforcePositive(
      dto.length,
      'length',
      errorMap,
      'Must be greater than 0',
    );

    // width
    this.helper.enforcePositive(
      dto.width,
      'width',
      errorMap,
      'Must be greater than 0',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateLabelTypeDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Item with this name already exists',
      );
    }

    if (dto.length) {
      this.helper.enforcePositive(
        dto.length,
        'length',
        errorMap,
        'Must be greater than 0',
      );
    }

    if (dto.width) {
      this.helper.enforcePositive(
        dto.width,
        'width',
        errorMap,
        'Must be greater than 0',
      );
    }

    return errorMap;
  }
}
