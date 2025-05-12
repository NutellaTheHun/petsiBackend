import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildMenuItemComponentDto {
    readonly mode: 'update' = 'update';

    /**
     * Used when building as a child
     */
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

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