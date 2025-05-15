import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

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
}