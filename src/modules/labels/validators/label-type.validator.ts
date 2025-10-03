import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
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

  public async validateCreate(
    createId: string,
    dto: CreateLabelTypeDto,
  ): Promise<void> {
    if (
      await this.helper.exists(this.repo, 'labelTypeName', dto.labelTypeName)
    ) {
      this.addError(
        this.buildValidationError(
          'labelTypeName',
          'Label type name already exists.',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateLabelTypeDto,
  ): Promise<void> {
    if (dto.labelTypeName) {
      const exists = await this.repo.findOne({
        where: { labelTypeName: dto.labelTypeName },
      });
      if (exists && exists.id !== id) {
        this.addError(
          this.buildValidationError(
            'labelTypeName',
            'Label type name already exists.',
            'EXIST',
            id,
          ),
        );
      }
    }
    this.throwIfErrors();
  }
}
