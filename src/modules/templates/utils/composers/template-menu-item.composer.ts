import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { ResolverContext } from '../../../../common/types/resolver-context.type';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { CreateTemplateMenuItemDto } from '../../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../../dto/template-menu-item/update-template-menu-item.dto';
import {
    TemplateMenuItem,
    TemplateMenuItemEntity,
} from '../../entities/template-menu-item.entity';

@Injectable()
export class TemplateMenuItemComposer extends ComposerBase<TemplateMenuItemEntity> {
    protected readonly entityClass = TemplateMenuItem;

    protected async createInTransaction(
        dto: CreateTemplateMenuItemDto,
        manager: EntityManager,
    ): Promise<TemplateMenuItem> {
        const result = manager.create(TemplateMenuItem, {
            displayName: dto.displayName,
            menuItem: { id: dto.menuItemId },
            tablePosIndex: dto.tablePosIndex,
            parentTemplate: { id: dto.parentTemplateId },
        });

        return result;
    }

    protected async updateInTransaction(
        dto: UpdateTemplateMenuItemDto,
        manager: EntityManager,
        entity: TemplateMenuItem,
    ): Promise<void> {
        if (dto.displayName !== undefined) {
            entity.displayName = dto.displayName;
        }

        if (dto.menuItemId !== undefined) {
            entity.menuItem = manager.create(MenuItem, { id: dto.menuItemId });
        }

        if (dto.tablePosIndex !== undefined) {
            entity.tablePosIndex = dto.tablePosIndex;
        }
        /*
        if (dto.parentTemplateId !== undefined) {
          entity.parentTemplate = manager.create(Template, {
            id: dto.parentTemplateId,
          });
        }*/
    }

    protected resolveCreateDto(
        dto: NestedCreateTemplateMenuItemDto,
        context?: ResolverContext,
    ): CreateTemplateMenuItemDto {
        if (!context?.parentTemplateId) {
            throw new Error('Parent template id is required');
        }
        return {
            displayName: dto.displayName,
            menuItemId: dto.menuItemId,
            tablePosIndex: dto.tablePosIndex,
            parentTemplateId: context.parentTemplateId,
        };
    }
}
