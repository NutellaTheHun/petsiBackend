import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import {
  TemplateMenuItem,
  TemplateMenuItemEntity,
} from '../entities/template-menu-item.entity';

@Injectable()
export class TemplateMenuItemValidator extends ValidatorBase<TemplateMenuItemEntity> {
  constructor(
    @InjectRepository(TemplateMenuItem)
    private readonly repo: Repository<TemplateMenuItem>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'TemplateMenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateTemplateMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.tablePosIndex < 0) {
      const err = new ValidationErrorNode(
        'tablePosIndex',
        id,
        'positional index cannot be less than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateTemplateMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.tablePosIndex && dto.tablePosIndex < 0) {
      const err = new ValidationErrorNode(
        'tablePosIndex',
        id,
        'positional index cannot be less than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
