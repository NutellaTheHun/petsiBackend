import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'labelTypeName',
      results,
      'Item with this name already exists',
      id,
    );

    // length
    this.helper.enforcePositive(
      dto.length,
      'labelTypeLength',
      results,
      'Must be greater than 0',
      id,
    );

    // width
    this.helper.enforcePositive(
      dto.width,
      'labelTypeWidth',
      results,
      'Must be greater than 0',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateLabelTypeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'labelTypeName',
        results,
        'Item with this name already exists',
        id,
      );
    }

    if (dto.length) {
      this.helper.enforcePositive(
        dto.length,
        'labelTypeLength',
        results,
        'Must be greater than 0',
        id,
      );
    }
    if (dto.width) {
      this.helper.enforcePositive(
        dto.width,
        'labelTypeWidth',
        results,
        'Must be greater than 0',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
