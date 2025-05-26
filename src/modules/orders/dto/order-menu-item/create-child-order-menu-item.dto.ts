import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildOrderContainerItemDto } from "../order-container-item/create-child-order-container-item.dto";

export class CreateChildOrderMenuItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Order entity.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({
        description: 'Id of MenuItem entity being ordered.',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemId: number

    @ApiProperty({
        description: 'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemSizeId: number

    @ApiProperty({ description: 'Amount being ordered.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number

    @ApiProperty({
        description: 'Dtos when creating an OrderMenuItem entity that is a MenuItem with MenuItemContainerOptions',
        type: [CreateChildOrderContainerItemDto]
    })
    @IsArray()
    @IsOptional()
    readonly orderedItemContainerDtos?: CreateChildOrderContainerItemDto[];
}