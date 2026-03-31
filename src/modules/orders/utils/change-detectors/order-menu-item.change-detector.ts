import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorChange,
    ChangeDetectorBase,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateOrderContainerItemDto } from '../../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../../dto/order-container-item/nested-update-order-container-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../../dto/order-menu-item/nested-update-order-menu-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';
import { orderMenuItemToNestedUpdateDto } from '../entity-transformers/order-menu-item.dto.transformer';
import { OrderContainerItemChangeDetector } from './order-container-item.change-detector';

type NestedContainerDto =
    | NestedCreateOrderContainerItemDto
    | NestedUpdateOrderContainerItemDto;

@Injectable()
export class OrderMenuItemChangeDetector extends ChangeDetectorBase<
    OrderMenuItem,
    NestedUpdateOrderMenuItemDto
> {
    constructor(
        private readonly containerItemChangeDetector: OrderContainerItemChangeDetector,
    ) {
        super();
    }

    public detect(
        entity: OrderMenuItem,
        dto: NestedUpdateOrderMenuItemDto,
    ): ChangeDetectionResult<NestedUpdateOrderMenuItemDto> {
        const existingDto = orderMenuItemToNestedUpdateDto(entity);
        const patch: MutablePartial<NestedUpdateOrderMenuItemDto> = {
            id: dto.id,
        };
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(existingDto.menuItemId, dto.menuItemId)) {
            patch.menuItemId = dto.menuItemId;
            changes.push({
                op: 'reference',
                path: 'menuItemId',
                previousValue: existingDto.menuItemId,
                nextValue: dto.menuItemId,
            });
        }

        if (!this.unchanged(existingDto.sizeId, dto.sizeId)) {
            patch.sizeId = dto.sizeId;
            changes.push({
                op: 'reference',
                path: 'sizeId',
                previousValue: existingDto.sizeId,
                nextValue: dto.sizeId,
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

        const containerPatch = this.detectContainerItems(
            entity.containerOrderMenuItems ?? [],
            dto.containerOrderMenuItems,
        );
        if (containerPatch.length > 0) {
            patch.containerOrderMenuItems = containerPatch;
            changes.push({
                op: 'aggregate',
                path: 'containerOrderMenuItems',
                previousValue: existingDto.containerOrderMenuItems ?? [],
                nextValue: containerPatch,
            });
        }

        return {
            patch,
            changes,
            hasChanges: changes.length > 0,
        };
    }

    private detectContainerItems(
        existingItems: OrderContainerItem[],
        incomingDtos?: NestedContainerDto[],
    ): NestedContainerDto[] {
        if (!incomingDtos) {
            return [];
        }

        const patchDtos: NestedContainerDto[] = [];
        const existingById = new Map<number, OrderContainerItem>();

        for (const existingItem of existingItems) {
            existingById.set(existingItem.id, existingItem);
        }

        for (const dto of incomingDtos) {
            if ('createId' in dto) {
                patchDtos.push(dto);
                continue;
            }

            const existingItem = existingById.get(dto.id);
            if (!existingItem) {
                patchDtos.push(dto);
                continue;
            }

            const childResult = this.containerItemChangeDetector.detect(
                existingItem,
                dto,
            );
            if (childResult.hasChanges) {
                patchDtos.push(childResult.patch as NestedUpdateOrderContainerItemDto);
            }
        }

        return patchDtos;
    }
}
