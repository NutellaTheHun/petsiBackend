import { EntityManager } from 'typeorm';
import { UpdateMenuItemContainerRuleDto } from '../../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import { MenuItemContainerRule } from '../../entities/menu-item-container-rule.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items.module';

export async function MenuItemContainerRuleUpdateInTransaction(
  dto: UpdateMenuItemContainerRuleDto,
  manager: EntityManager,
  entity: MenuItemContainerRule,
): Promise<void> {
  if (dto.maxQuantity !== undefined) {
    entity.maxQuantity = dto.maxQuantity;
  }

  if (dto.parentMenuItemId !== undefined) {
    entity.parentMenuItem = manager.create(MenuItem, {
      id: dto.parentMenuItemId,
    });
  }

  if (dto.validMenuItemId !== undefined) {
    entity.validItem = manager.create(MenuItem, {
      id: dto.validMenuItemId,
    });
  }

  // reassigns the validSizes to what the DTO says, but frontend has the diff checking? with diff checking,
  // how are removals handled if not just reassigning the entire array
  if (dto.validSizeIds) {
    entity.validSizes = dto.validSizeIds.map((id) =>
      manager.create(MenuItemSize, { id }),
    );
  }
}
