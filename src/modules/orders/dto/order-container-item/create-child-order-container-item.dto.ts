import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateChildOrderContainerItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Order-Menu-Item entity.' })
    readonly mode: 'create' = 'create';

    @ApiProperty({ description: 'Id of the Menu-Item that is this item\'s container' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    parentContainerMenuItemId: number;

    @ApiProperty({ description: 'Id of the Menu-Item that is being ordered' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    containedMenuItemId: number;

    @ApiProperty({ description: 'Id of the Menu-Item-Size that is being ordered, must be a valid size to the containedMenuItem' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    containedMenuItemSizeId: number;

    @ApiProperty({ description: 'amount of the containedMenuItem / containedItemSize being ordered' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    quantity: number;
}