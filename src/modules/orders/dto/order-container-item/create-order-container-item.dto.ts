import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { Order } from "../../entities/order.entity";

/**
 * Depreciated, only created as a child through {@link Order}.
 */
export class CreateOrderContainerItemDto {
    @ApiProperty({ description: 'Id of the Order-Menu-Item that is this container (the parent)' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    parentOrderMenuItemId: number;

    @ApiProperty({ description: 'Id of the Menu-Item that is being ordered' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    containedMenuItemId: number;

    @ApiProperty({ description: 'Id of the Menu-Item-Size that is being ordered, must be a valid size to the containedMenuItem' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    containedItemSizeId: number;

    @ApiProperty({ description: 'amount of the containedMenuItem / containedItemSize being ordered' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    quantity: number;
}