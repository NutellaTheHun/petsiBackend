import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateMenuItemComponentDto {
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemSizeId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly quantity?: number;
}