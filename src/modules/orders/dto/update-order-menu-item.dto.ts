import { IsNumber, IsPositive } from 'class-validator';
import { BaseOrderMenuItemDto } from './base-order-menu-item.dto';

export class UpdateOrderMenuItemDto extends BaseOrderMenuItemDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;
}
