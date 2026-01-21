import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template, TemplateEntity } from '../entities/template.entity';
import { TemplateMenuItemAggregateValidator } from './aggregate-validators/template-menu-item.aggregate.validator';
import { TemplateMenuItemValidator } from './template-menu-item.validator';

@Injectable()
export class TemplateValidator extends ValidatorBase<TemplateEntity> {
  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,
    private readonly templateItemValidator: TemplateMenuItemValidator,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Template', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateTemplateDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Template with this name already exists.',
    );

    if (dto.templateMenuItems?.length) {
      // check duplicate templateMenuItems
      const tmiValidator = new TemplateMenuItemAggregateValidator(
        dto.templateMenuItems,
      );

      // enforce no duplicate tablePosIndex
      tmiValidator.enforceUniqueTablePosIndex(
        'templateMenuItems',
        errorMap,
        'duplicate table position on template',
      );

      // enforce no duplicate menuItem
      tmiValidator.enforceUniqueMenuItem(
        'templateMenuItems',
        errorMap,
        'duplicate menu item on template',
      );

      // nested dto validation
      await this.templateItemValidator.validateManyNestedNode(
        'templateMenuItems',
        dto.templateMenuItems,
        errorMap,
      );
    }

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateTemplateDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Template with this name already exists.',
      );
    }

    if (dto.templateMenuItems?.length) {
      const currentTemplateMenuItems = await this.repo.findOne({
        where: {
          id: id,
        },
        relations: ['templateMenuItems'],
      });
      if (!currentTemplateMenuItems) {
        throw new Error();
      }
      // check duplicate templateMenuItems
      const tmiValidator = new TemplateMenuItemAggregateValidator(
        dto.templateMenuItems,
        currentTemplateMenuItems.templateMenuItems,
      );

      // enforce no duplicate tablePosIndex
      tmiValidator.enforceUniqueTablePosIndex(
        'templateMenuItems',
        errorMap,
        'duplicate table position on template',
      );

      // enforce no duplicate menuItem
      tmiValidator.enforceUniqueMenuItem(
        'templateMenuItems',
        errorMap,
        'duplicate menu item on template',
      );

      // nested dto validation
      await this.templateItemValidator.validateManyNestedNode(
        'templateMenuItems',
        dto.templateMenuItems,
        errorMap,
      );
    }

    return errorMap;
  }
}
