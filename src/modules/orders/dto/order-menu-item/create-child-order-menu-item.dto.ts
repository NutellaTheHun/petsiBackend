import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildOrderMenuItemComponentDto } from "../order-menu-item-component/create-child-order-menu-item-component.dto";

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

    @ApiProperty({ description: 'Dtos when creating an Order-Menu-Item entity that is a container for a list of Menu-Item',
        type: [CreateChildOrderMenuItemComponentDto]
     })
    @IsArray()
    @IsOptional()
    readonly orderedItemComponentDtos?: CreateChildOrderMenuItemComponentDto[];
}