import { AggregateValidatorBase } from '../../../../common/base/aggregate-validator.base';
import { NestedCreateOrderContainerItemDto } from '../../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../../dto/order-container-item/nested-update-order-container-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { OrderMenuItemEntity } from '../../entities/order-menu-item.entity';

/**
 * Identity for validating container items,
 * used to normalize the container items for validation
 * when combining DTOs with entities.
 */
type ContainerItemIdentity = {
  containedMenuItemId: number;
  containedItemSizeId: number;
  quantity: number;
};

export class OrderMenuItemAggregateValidator extends AggregateValidatorBase<OrderMenuItemEntity> {
  protected entityKey(entity: OrderMenuItemEntity['__Entity']): string {
    return this.entityOrderMenuItemKey(entity);
  }
  protected createDtoKey(dto: OrderMenuItemEntity['__NcDto']): string {
    return this.dtoOrderMenuItemKey(dto);
  }
  protected applyUpdateKey(
    entity: OrderMenuItemEntity['__Entity'],
    dto: OrderMenuItemEntity['__NuDto'],
  ): string {
    const mergedContainers = this.mergeContainerIdentities(
      entity.containerOrderMenuItems ?? [],
      dto.containerOrderMenuItems ?? [],
    );

    return this.entityOrderMenuItemKey({
      ...entity,
      menuItem: dto.menuItemId ? { id: dto.menuItemId } : entity.menuItem,
      size: dto.sizeId ? { id: dto.sizeId } : entity.size,
      containerOrderMenuItems: mergedContainers.map(this.identityToEntityLike),
    } as any);
  }

  // Helpers
  /**
   * Returns a key for a orderMenuItem entity from a nested create dto, if there are container items, the key will include the container item contents.
   */
  private dtoOrderMenuItemKey(dto: OrderMenuItemEntity['__NcDto']): string {
    const base = `${dto.menuItemId}:${dto.sizeId}`;

    if (!dto.containerOrderMenuItems?.length) {
      return base;
    }

    return `${base}::${this.dtoContainerContentsKey(dto.containerOrderMenuItems)}`;
  }

  /**
   * Returns a key for a list of container items from a nested create dto, the key is a sorted list of the container item contents.
   */
  private dtoContainerContentsKey(
    items: NestedCreateOrderContainerItemDto[],
  ): string {
    return items
      .map(
        (i) =>
          `${i.containedMenuItemId}:${i.containedItemSizeId}:${i.quantity}`,
      )
      .sort()
      .join('|');
  }

  /**
   * Returns a key for a orderMenuItem from an entity, if there are container items, the key will include the container item contents.
   */
  private entityOrderMenuItemKey(
    entity: OrderMenuItemEntity['__Entity'],
  ): string {
    const base = `${entity.menuItem.id}:${entity.size.id}`;

    if (!entity.containerOrderMenuItems?.length) {
      return base;
    }

    const contents = this.entityContainerContentsKey(
      entity.containerOrderMenuItems,
    );
    return `${base}::${contents}`;
  }

  /**
   * Returns a key for a list of container items from an entity, the key is a sorted list of the container item contents.
   */
  private entityContainerContentsKey(items: OrderContainerItem[]): string {
    return items
      .map(
        (i) =>
          `${i.containedMenuItem.id}:${i.containedItemSize.id}:${i.quantity}`,
      )
      .sort()
      .join('|');
  }

  /**
   * combines a list of entities and dtos into a list of identities. Required when updating an order menu item.
   * Handles the patching from update dtos over entities and includes unaffected entities, and includes create dto items for validation.
   */
  private mergeContainerIdentities(
    entities: OrderContainerItem[],
    dtos: (
      | NestedCreateOrderContainerItemDto
      | NestedUpdateOrderContainerItemDto
    )[],
  ): ContainerItemIdentity[] {
    const map = new Map<string | number, ContainerItemIdentity>();
    for (const entity of entities) {
      map.set(entity.id, this.entityContainerToIdentity(entity));
    }
    for (const dto of dtos) {
      if ('id' in dto) {
        const existing = entities.find((e) => e.id === dto.id);
        if (!existing) {
          throw new Error('Container item not found');
        }

        map.set(dto.id, this.applyContainerUpdate(existing, dto));
      } else {
        map.set(dto.createId, this.createContainerToIdentity(dto));
      }
    }
    return [...map.values()];
  }

  /**
   * Applies an update to a container item from a nested update dto that relates to validation.
   */
  private applyContainerUpdate(
    entity: OrderContainerItem,
    dto: NestedUpdateOrderContainerItemDto,
  ): ContainerItemIdentity {
    return {
      containedMenuItemId:
        dto.containedMenuItemId ?? entity.containedMenuItem.id,
      containedItemSizeId:
        dto.containedItemSizeId ?? entity.containedItemSize.id,
      quantity: dto.quantity ?? entity.quantity,
    };
  }

  private entityContainerToIdentity(
    item: OrderContainerItem,
  ): ContainerItemIdentity {
    return {
      containedMenuItemId: item.containedMenuItem.id,
      containedItemSizeId: item.containedItemSize.id,
      quantity: item.quantity,
    };
  }

  private createContainerToIdentity(
    dto: NestedCreateOrderContainerItemDto,
  ): ContainerItemIdentity {
    return {
      containedMenuItemId: dto.containedMenuItemId,
      containedItemSizeId: dto.containedItemSizeId,
      quantity: dto.quantity,
    };
  }

  private identityToEntityLike(identity: ContainerItemIdentity) {
    return {
      containedMenuItem: { id: identity.containedMenuItemId },
      containedItemSize: { id: identity.containedItemSizeId },
      quantity: identity.quantity,
    };
  }
}
