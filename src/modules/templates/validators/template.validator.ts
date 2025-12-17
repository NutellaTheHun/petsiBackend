import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template, TemplateEntity } from '../entities/template.entity';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // exists
    if (await this.helper.exists(this.repo, 'templateName', dto.name)) {
      const err = new ValidationErrorNode(
        'templateName',
        id,
        'Template with this name already exists.',
      );
      results.push(err);
    }

    if (dto.templateMenuItemDtos && dto.templateMenuItemDtos.length > 0) {
      // check duplicate templateMenuItems
      const seen = new Set<number>();
      for (const nestedDto of dto.templateMenuItemDtos) {
        if (!nestedDto.createDto) {
          throw new Error(
            `create template validation: nested template item missing create dto`,
          );
        }
        if (seen.has(nestedDto.createDto.menuItemId)) {
          const err = new ValidationErrorNode(
            'templateItems',
            id,
            'duplicate menu item on template',
          );
          results.push(err);
        } else {
          seen.add(nestedDto.createDto.menuItemId);
        }
      }

      // nested dto validation
      const nestedDtoErrs =
        await this.templateItemValidator.validateManyNestedNode(
          'templateItems',
          dto.templateMenuItemDtos,
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

    // exists
    if (dto.name) {
      if (await this.helper.exists(this.repo, 'templateName', dto.name)) {
        const err = new ValidationErrorNode(
          'templateName',
          id,
          'Template with this name already exists.',
        );
        results.push(err);
      }
    }

    if (dto.templateMenuItemDtos && dto.templateMenuItemDtos.length > 0) {
      // check duplicate templateMenuItems
      const itemMap = new Map<string | number, number>();
      const seen = new Set<number>();

      const currentTemplate = await this.repo.findOne({
        where: { id },
        relations: ['templateItems', 'templateItems.menuItem'],
      });
      if (!currentTemplate) {
        throw new Error(
          `update template validation: template being updated with id ${id} not found`,
        );
      }
      for (const entry of currentTemplate.templateMenuItems) {
        itemMap.set(entry.id, entry.menuItem.id);
      }
      for (const nestedDto of dto.templateMenuItemDtos) {
        if (nestedDto.createDto && nestedDto.createId) {
          itemMap.set(nestedDto.createId, nestedDto.createDto.menuItemId);
        } else if (nestedDto.updateDto && nestedDto.id) {
          if (nestedDto.updateDto.menuItemId) {
            itemMap.set(nestedDto.id, nestedDto.updateDto.menuItemId);
          }
        }
      }
      for (const val of itemMap.values()) {
        if (seen.has(val)) {
          const err = new ValidationErrorNode(
            'templateItems',
            id,
            'duplicate menu item on template',
          );
          results.push(err);
        } else {
          seen.add(val);
        }
      }

      // nested dto validation
      const nestedDtoErrs =
        await this.templateItemValidator.validateManyNestedNode(
          'templateItems',
          dto.templateMenuItemDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
