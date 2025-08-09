import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';

@Injectable()
export class TemplateValidator extends ValidatorBase<Template> {
  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,

    @Inject(forwardRef(() => TemplateMenuItemService))
    private readonly itemService: TemplateMenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Template', requestContextService, logger);
  }

  public async validateCreate(dto: CreateTemplateDto): Promise<void> {
    if (await this.helper.exists(this.repo, 'templateName', dto.templateName)) {
      this.addError({
        errorMessage: 'Template with that name already exists.',
        errorType: 'EXIST',
        contextEntity: 'CreateTemplateDto',
        sourceEntity: 'InventoryArea',
        value: dto.templateName,
      } as ValidationError);
    }

    if (dto.templateItemDtos) {
      // no duplicate menuItems
      const duplicateItems = this.helper.findDuplicates(
        dto.templateItemDtos,
        (item) => `${item.menuItemId}`,
      );
      if (duplicateItems) {
        for (const dup of duplicateItems) {
          this.addError({
            errorMessage: 'duplicate menu items on template',
            errorType: 'DUPLICATE',
            contextEntity: 'CreateTemplateDto',
            sourceEntity: 'MenuItem',
            sourceId: dup.menuItemId,
          } as ValidationError);
        }
      }

      // no duplicate tablePosIndex
      const duplicatePos = this.helper.findDuplicates(
        dto.templateItemDtos,
        (item) => `${item.tablePosIndex}`,
      );
      if (duplicatePos) {
        for (const dup of duplicatePos) {
          this.addError({
            errorMessage: 'duplicate template row positions',
            errorType: 'DUPLICATE',
            contextEntity: 'CreateTemplateDto',
            sourceEntity: 'TemplateMenuItem',
            value: dup.tablePosIndex,
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateTemplateDto,
  ): Promise<void> {
    if (dto.templateName) {
      if (
        await this.helper.exists(this.repo, 'templateName', dto.templateName)
      ) {
        this.addError({
          errorMessage: 'Template with that name already exists.',
          errorType: 'EXIST',
          contextEntity: 'UpdateTemplateDto',
          contextId: id,
          sourceEntity: 'InventoryArea',
          value: dto.templateName,
        } as ValidationError);
      }
    }

    if (dto.templateItemDtos) {
      // resolve
      const resolvedItemDtos: number[] = [];
      const resolvedTablePosDtos: number[] = [];
      const resolvedIds: number[] = [];
      for (const nested of dto.templateItemDtos) {
        if (nested.createDto) {
          resolvedItemDtos.push(nested.createDto.menuItemId);
          resolvedTablePosDtos.push(nested.createDto.tablePosIndex);
        }
        if (nested.updateDto && nested.id) {
          const currentItem = await this.itemService.findOne(nested.id, [
            'menuItem',
          ]);

          resolvedItemDtos.push(
            nested.updateDto.menuItemId ?? currentItem.menuItem.id,
          );
          resolvedTablePosDtos.push(
            nested.updateDto.tablePosIndex ?? currentItem.tablePosIndex,
          );
          resolvedIds.push(nested.id);
        }
      }

      // no duplicate menuItems
      const duplicateItems = this.helper.findDuplicates(
        resolvedItemDtos,
        (item) => `${item}`,
      );
      if (duplicateItems) {
        for (const dup of duplicateItems) {
          this.addError({
            errorMessage: 'duplicate menu items on template',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateTemplateDto',
            contextId: id,
            sourceEntity: 'MenuItem',
            sourceId: dup,
          } as ValidationError);
        }
      }

      // no duplicate tablePosIndex
      const duplicatePos = this.helper.findDuplicates(
        resolvedTablePosDtos,
        (index) => `${index}`,
      );
      if (duplicatePos) {
        for (const dup of duplicatePos) {
          this.addError({
            errorMessage: 'duplicate template row positions',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateTemplateDto',
            contextId: id,
            sourceEntity: 'TemplateMenuItem',
            value: dup,
          } as ValidationError);
        }
      }

      // no multiple update dtos for same entity
      const duplicateIds = this.helper.findDuplicates(
        resolvedIds,
        (id) => `${id}`,
      );
      if (duplicateIds) {
        for (const dupId of duplicateIds) {
          this.addError({
            errorMessage: 'Multiple update requests for the same template item',
            errorType: 'INVALID',
            contextEntity: 'UpdateTemplateDto',
            contextId: id,
            sourceEntity: 'TemplateMenuItem',
            sourceId: dupId,
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }
}
