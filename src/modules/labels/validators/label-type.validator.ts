import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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

    // name exists
    if (
      await this.helper.exists(this.repo, 'labelTypeName', dto.labelTypeName)
    ) {
      const err = new ValidationErrorNode(
        'labelTypeName',
        id,
        'Label type name already exists.',
      );
      results.push(err);
    }

    // length / width cannot be less than or equal to 0
    this.helper.lessThanEqualZeroCheck(
      dto.labelTypeLength,
      'labelTypeLength',
      results,
      'Label length cannot be less than or equal to 0',
      id,
    );
    this.helper.lessThanEqualZeroCheck(
      dto.labelTypeWidth,
      'labelTypeWidth',
      results,
      'Label width cannot be less than or equal to 0',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateLabelTypeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name exists
    if (dto.labelTypeName) {
      if (
        await this.helper.exists(this.repo, 'labelTypeName', dto.labelTypeName)
      ) {
        const err = new ValidationErrorNode(
          'labelTypeName',
          id,
          'Label type name already exists.',
        );
        results.push(err);
      }
    }

    // length / width cannot be less than or equal to 0
    if (dto.labelTypeLength) {
      this.helper.lessThanEqualZeroCheck(
        dto.labelTypeLength,
        'labelTypeLength',
        results,
        'Label length cannot be less than or equal to 0',
        id,
      );
    }
    if (dto.labelTypeWidth) {
      this.helper.lessThanEqualZeroCheck(
        dto.labelTypeWidth,
        'labelTypeWidth',
        results,
        'Label width cannot be less than or equal to 0',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
