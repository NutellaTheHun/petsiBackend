import { EntityManager } from 'typeorm';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { UpdateTemplateMenuItemDto } from '../../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../../entities/template-menu-item.entity';
import { Template } from '../../entities/template.entity';

export async function TemplateMenuItemUpdateInTransaction(
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

  if (dto.parentTemplateId !== undefined) {
    entity.parentTemplate = manager.create(Template, {
      id: dto.parentTemplateId,
    });
  }
}
