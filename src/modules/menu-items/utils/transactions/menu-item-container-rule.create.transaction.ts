import { EntityManager } from 'typeorm';
import { CreateMenuItemContainerRuleDto } from '../../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { MenuItemContainerRule } from '../../entities/menu-item-container-rule.entity';

export async function MenuItemContainerRuleCreateInTransaction(
  dto: CreateMenuItemContainerRuleDto,
  manager: EntityManager,
): Promise<MenuItemContainerRule> {
  const result = manager.create(MenuItemContainerRule, {
    parentMenuItem: { id: dto.parentMenuItemId },
    validItem: { id: dto.validMenuItemId },
    validSizes: dto.validSizeIds?.map((id) => ({ id })),
    maxQuantity: dto.maxQuantity,
  });
  return result;
}
