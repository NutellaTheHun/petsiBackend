import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateChildOrderMenuItemDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

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
