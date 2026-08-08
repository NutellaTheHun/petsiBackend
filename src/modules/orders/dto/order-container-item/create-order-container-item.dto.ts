import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';

export class CreateOrderContainerItemDto {
    @ApiProperty({
        description: 'Id of the MenuItem that is being ordered',
        example: 3,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly containedMenuItemId: EntityId<MenuItem>;

    @ApiProperty({
        description:
            'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
        example: 4,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly containedItemSizeId: EntityId<MenuItemSize>;

    @ApiProperty({
        description:
            'amount of the containedMenuItem / containedItemSize being ordered',
        example: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number;

    @ApiProperty({
        description:
            'Id of the OrderMenuItem that is the parent. Only used when creating through the OrderMenuItem endpoint, since the parent isnt assigned an Id yet.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly parentOrderMenuItemId: EntityId<OrderMenuItem>;

    /**
     * Stamped from the parent OrderMenuItem's own tenantId/locationId (which
     * itself was stamped from the parent Order — see resolveCreateDto in
     * OrderContainerItemComposer) — never supplied by a client and never
     * independently re-derived from request context.
     */
    @ApiProperty({
        description: "The parent Order's tenantId. Populated internally, not client-supplied.",
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly tenantId: number;

    @ApiProperty({
        description: "The parent Order's locationId. Populated internally, not client-supplied.",
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly locationId: number;
}
