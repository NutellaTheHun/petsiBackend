import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildOrderContainerItemDto } from "../order-container-item/create-child-order-container-item.dto";
import { Order } from "../../entities/order.entity";
/**
 * Depreciated, only created as a child through {@link Order}.
 */
export class CreateOrderMenuItemDto {
    @ApiProperty({ description: 'Id of Order entity the Order-Menu-Item belongs to.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly orderId: number;

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
        type: [CreateChildOrderContainerItemDto]
        })
    @IsArray()
    @IsOptional()
    readonly OrderedItemComponentDtos?: CreateChildOrderContainerItemDto[];
}