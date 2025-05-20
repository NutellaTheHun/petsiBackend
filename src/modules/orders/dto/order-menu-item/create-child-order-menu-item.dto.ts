import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildOrderContainerItemDto } from "../order-container-item/create-child-order-container-item.dto";

export class CreateChildOrderMenuItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Order entity.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({ description: 'Id of Menu-Item entity being ordered.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemId: number

    @ApiProperty({ description: 'Id of the Menu-Item-Size entity. Must be valid size for the Menu-Item being ordered.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemSizeId: number

    @ApiProperty({ description: 'Amount being ordered.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number

    @ApiProperty({ description: 'Dtos when creating an Order-Menu-Item entity that is a Menu-Item with Menu-Item-Container-Options',
        type: [CreateChildOrderContainerItemDto]
     })
    @IsArray()
    @IsOptional()
    readonly orderedItemContainerDtos?: CreateChildOrderContainerItemDto[];
}