import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import {
  TemplateMenuItem,
  TemplateMenuItemEntity,
} from '../entities/template-menu-item.entity';

@Injectable()
export class TemplateMenuItemValidator extends ValidatorBase<TemplateMenuItemEntity> {
  constructor(
    @InjectRepository(TemplateMenuItem)
    repo: Repository<TemplateMenuItem>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'TemplateMenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateTemplateMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.tablePosIndex < 0) {
      errorMap.addChild(
        'tablePosIndex',
        new ValidationErrorMap(
          undefined,
          'positional index cannot be less than 0',
        ),
      );
    }

    return errorMap;
  }

  protected async doValidateNestedCreateNode(
    dto: NestedCreateTemplateMenuItemDto,
    id: string,
  ): Promise<ValidationErrorMap> {
    // Currently no difference in validation between nested create and root create
    return await this.doValidateCreateNode(
      dto as unknown as CreateTemplateMenuItemDto,
      id,
    );
  }

  protected async doValidateUpdateNode(
    dto: UpdateTemplateMenuItemDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.tablePosIndex !== undefined && dto.tablePosIndex < 0) {
      errorMap.addChild(
        'tablePosIndex',
        new ValidationErrorMap(
          undefined,
          'positional index cannot be less than 0',
        ),
      );
    }

    return errorMap;
  }

  protected async doValidateNestedUpdateNode(
    dto: NestedUpdateTemplateMenuItemDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    // Currently no difference in validation between nested update and root update
    return await this.doValidateUpdateNode(
      dto as unknown as UpdateTemplateMenuItemDto,
      id,
    );
  }
}
