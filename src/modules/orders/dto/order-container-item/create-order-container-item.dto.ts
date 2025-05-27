import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { Order } from "../../entities/order.entity";

/**
 * Depreciated, only created as a child through {@link Order}.
 */
export class CreateOrderContainerItemDto {
    @ApiProperty({
        description: 'Id of the OrderMenuItem that is the parent',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    parentOrderMenuItemId: number;

    @ApiProperty({
        description: 'Id of the MenuItem that is this item\'s container',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    parentContainerMenuItemId: number;

    @ApiProperty({
        description: 'Id of the MenuItem that is being ordered',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    containedMenuItemId: number;

    @ApiProperty({
        description: 'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    })
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