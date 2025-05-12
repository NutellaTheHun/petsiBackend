import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateOrderMenuItemDto {
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId?: number

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemSizeId?: number

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly quantity?: number
}
