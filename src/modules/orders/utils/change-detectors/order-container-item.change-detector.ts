import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorChange,
    ChangeDetectorBase,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateOrderContainerItemDto } from '../../dto/order-container-item/nested-update-order-container-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { orderContainerItemToNestedUpdateDto } from '../entity-transformers/order-container-item.dto.transformer';

@Injectable()
export class OrderContainerItemChangeDetector extends ChangeDetectorBase<
    OrderContainerItem,
    NestedUpdateOrderContainerItemDto
> {
    public detect(
        entity: OrderContainerItem,
        dto: NestedUpdateOrderContainerItemDto,
    ): ChangeDetectionResult<NestedUpdateOrderContainerItemDto> {
        const existingDto = orderContainerItemToNestedUpdateDto(entity);
        const patch: MutablePartial<NestedUpdateOrderContainerItemDto> = {
            id: dto.id,
        };
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(existingDto.containedMenuItemId, dto.containedMenuItemId)) {
            patch.containedMenuItemId = dto.containedMenuItemId;
            changes.push({
                op: 'reference',
                path: 'containedMenuItemId',
                previousValue: existingDto.containedMenuItemId,
                nextValue: dto.containedMenuItemId,
            });
        }

        if (!this.unchanged(existingDto.containedItemSizeId, dto.containedItemSizeId)) {
            patch.containedItemSizeId = dto.containedItemSizeId;
            changes.push({
                op: 'reference',
                path: 'containedItemSizeId',
                previousValue: existingDto.containedItemSizeId,
                nextValue: dto.containedItemSizeId,
            });
        }

        if (!this.unchanged(existingDto.quantity, dto.quantity)) {
            patch.quantity = dto.quantity;
            changes.push({
                op: 'scalar',
                path: 'quantity',
                previousValue: existingDto.quantity,
                nextValue: dto.quantity,
            });
        }

        return {
            patch,
            changes,
            hasChanges: changes.length > 0,
        };
    }
}
