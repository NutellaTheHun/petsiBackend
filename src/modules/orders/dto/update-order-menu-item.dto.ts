import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateOrderMenuItemDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId: number

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemSizeId: number

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly quantity: number
}
