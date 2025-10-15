import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template, TemplateEntity } from '../entities/template.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';
import { TemplateMenuItemValidator } from './template-menu-item.validator';

@Injectable()
export class TemplateValidator extends ValidatorBase<TemplateEntity> {
  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,

    @Inject(forwardRef(() => TemplateMenuItemService))
    private readonly itemService: TemplateMenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
    private readonly templateItemValidator: TemplateMenuItemValidator,
  ) {
    super(repo, 'Template', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateTemplateDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (await this.helper.exists(this.repo, 'templateName', dto.templateName)) {
      const err = new ValidationErrorNode(
        'templateName',
        undefined,
        'Template with this name already exists.',
      );
      results.push(err);
    }

    if (dto.templateItemDtos && dto.templateItemDtos.length > 0) {
      const nestedDtoErrs =
        await this.templateItemValidator.validateManyNestedNode(
          'templateItems',
          dto.templateItemDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateTemplateDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.templateName) {
      if (
        await this.helper.exists(this.repo, 'templateName', dto.templateName)
      ) {
        const err = new ValidationErrorNode(
          'templateName',
          undefined,
          'Template with this name already exists.',
        );
        results.push(err);
      }
    }

    if (dto.templateItemDtos && dto.templateItemDtos.length > 0) {
      const nestedDtoErrs =
        await this.templateItemValidator.validateManyNestedNode(
          'templateItems',
          dto.templateItemDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
