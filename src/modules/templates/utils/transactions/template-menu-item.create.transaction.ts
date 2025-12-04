import { EntityManager } from 'typeorm';
import { CreateTemplateMenuItemDto } from '../../dto/template-menu-item/create-template-menu-item.dto';
import { TemplateMenuItem } from '../../entities/template-menu-item.entity';

export async function TemplateMenuItemCreateInTransaction(
  dto: CreateTemplateMenuItemDto,
  manager: EntityManager,
): Promise<TemplateMenuItem> {
  const result = manager.create(TemplateMenuItem, {
    displayName: dto.displayName,
    menuItem: { id: dto.menuItemId },
    tablePosIndex: dto.tablePosIndex,
    ...(dto.templateId && { parentTemplate: { id: dto.templateId } }),
  });

  return result;
}
