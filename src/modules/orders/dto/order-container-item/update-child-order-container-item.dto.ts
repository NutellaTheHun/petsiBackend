import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildOrderContainerItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Order-Menu-Item entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the Order-Menu-Item-Container-Item to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ description: 'Id of the Menu-Item that is this item\'s container, not available to update, but required for validation' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    parentContainerMenuItemId?: number;

    @ApiProperty({ description: 'Id of the Menu-Item being ordered' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    containedMenuItemId?: number;

    @ApiProperty({ description: 'Id of the Menu-Item-Size that is being ordered, must be a valid size to the containedMenuItem' })
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