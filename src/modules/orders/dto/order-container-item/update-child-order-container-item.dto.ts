import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildOrderContainerItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a OrderMenuItem entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the OrderMenuItemContainerItem to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({
        description: 'Id of the MenuItem that is this item\'s container, not available to update, but required for validation',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    parentContainerMenuItemId?: number;

    @ApiProperty({
        description: 'Id of the MenuItem being ordered',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    containedMenuItemId?: number;

    @ApiProperty({
        description: 'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    containedMenuItemSizeId?: number;

    @ApiProperty({ description: 'amount of the componentMenuItem / componentItemSize being ordered' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    quantity?: number;
}