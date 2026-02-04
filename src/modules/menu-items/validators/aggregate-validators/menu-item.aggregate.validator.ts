import { AggregateValidatorBase } from '../../../../common/base/aggregate-validator.base';
import { MenuItemContainerItemEntity } from '../../entities/menu-item-container-item.entity';
import { MenuItemContainerItemValidatorIdentity } from '../identities/menu-item-container-item.validator.identity.interface';

export class MenuItemContainerItemAggregateValidator extends AggregateValidatorBase<MenuItemContainerItemEntity, MenuItemContainerItemValidatorIdentity> {
    protected applyUpdateKey(
        entity: MenuItemContainerItemEntity['__Entity'],
        identity: MenuItemContainerItemValidatorIdentity,
    ): string {
        return this.entityContainerItemKey({
            containedMenuItem: identity.containedMenuItemId
                ? { id: identity.containedMenuItemId }
                : entity.containedMenuItem,
            containedItemSize: identity.containedItemSizeId
                ? { id: identity.containedItemSizeId }
                : entity.containedItemSize,
        } as any);
    }

    protected createIdentityKey(identity: MenuItemContainerItemValidatorIdentity): string {
        return this.identityContainerItemKey(identity);
    }

    protected entityKey(entity: MenuItemContainerItemEntity['__Entity']): string {
        return this.entityContainerItemKey(entity);
    }

    // Helpers

    private entityContainerItemKey(
        entity: MenuItemContainerItemEntity['__Entity'],
    ): string {
        return `${entity.containedMenuItem.id}:${entity.containedItemSize.id}`;
    }

    private identityContainerItemKey(
        identity: MenuItemContainerItemValidatorIdentity,
    ): string {
        return `${identity.containedMenuItemId}:${identity.containedItemSizeId}`;
    }
}
