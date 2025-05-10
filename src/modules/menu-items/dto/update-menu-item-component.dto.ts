import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateMenuItemComponentDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemSizeId: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly quantity: number;
}