import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { Order } from "../../entities/order.entity";
import { CreateChildOrderContainerItemDto } from "../order-container-item/create-child-order-container-item.dto";
/**
 * Depreciated, only created as a child through {@link Order}.
 */
export class CreateOrderMenuItemDto {
    @ApiProperty({
        description: 'Id of Order entity the OrderMenuItem belongs to.',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly orderId: number;

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
        description: 'Dtos when creating an OrderMenuItem entity that is a container for a list of MenuItem',
        type: [CreateChildOrderContainerItemDto]
    })
    @IsArray()
    @IsOptional()
    readonly orderedItemContainerDtos?: CreateChildOrderContainerItemDto[];
}